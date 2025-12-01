'use client';

import { env } from './env';
import { createBrowserClient } from './supabase-browser-client';

export async function authedClientFetch(path: string, init: RequestInit = {}) {
  const supabase = createBrowserClient();
  
  // Use getUser() first to verify authentication (more secure)
  // This ensures the user is actually authenticated with Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('You must be signed in');
  }
  
  // After getUser() succeeds, get the session for the access token
  // getUser() refreshes the session, so this is safe now
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be signed in');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${session.access_token}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${env.apiBase}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          // Extract message from NestJS error format: { message: "...", error: "...", statusCode: ... }
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (parseError) {
        // If parsing fails, use default message
        console.warn('Failed to parse error response:', parseError);
      }
      
      const error = new Error(errorMessage);
      // Attach status code for error handling
      (error as any).status = response.status;
      // Mark content filter errors so they can be handled gracefully
      if (response.status === 400 && errorMessage.includes('not allowed')) {
        (error as any).isContentFilterError = true;
      }
      throw error;
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend is running.');
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Unable to connect to the server. Please ensure the backend is running.');
    }
    throw error;
  }
}
