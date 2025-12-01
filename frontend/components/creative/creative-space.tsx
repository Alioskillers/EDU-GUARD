'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { authedClientFetch } from '../../lib/client-api';
import { ContentFilterModal } from './content-filter-modal';

function DrawingCanvas({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const startDrawing = (e: MouseEvent) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      onSave(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [isDrawing, onSave]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-slate-200 rounded-xl bg-white cursor-crosshair mx-auto"
      width={600}
      height={400}
    />
  );
}

interface SavedCreation {
  id: string;
  title: string;
  type: 'STORY' | 'DRAWING' | 'CODE';
  content: string;
  created_at: string;
}

interface Props {
  childId: string;
}

export function CreativeSpace({ childId }: Props) {
  const [activeTab, setActiveTab] = useState<'story' | 'drawing' | 'code'>('story');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [drawingData, setDrawingData] = useState('');
  const [codeBlocks, setCodeBlocks] = useState<string[]>(['move_forward()', 'turn_left()']);
  const [savedCreations, setSavedCreations] = useState<SavedCreation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedCreations();
  }, []);

  const loadSavedCreations = async () => {
    try {
      const creations = await authedClientFetch('/creative/creations') as SavedCreation[];
      setSavedCreations(creations);
    } catch (error) {
      console.error('Failed to load creations:', error);
      setSavedCreations([]);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const saveCreation = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let content = '';
      let type: 'STORY' | 'DRAWING' | 'CODE' = 'STORY';
      let title = storyTitle || 'Untitled';

      if (activeTab === 'story') {
        content = storyContent;
        type = 'STORY';
        title = storyTitle || 'My Story';
      } else if (activeTab === 'drawing') {
        content = drawingData || 'Drawing saved';
        type = 'DRAWING';
        title = 'My Drawing';
      } else {
        content = JSON.stringify(codeBlocks);
        type = 'CODE';
        title = 'My Code';
      }

      await authedClientFetch('/creative/creations', {
        method: 'POST',
        body: JSON.stringify({
          child_id: childId,
          title,
          type,
          content,
        }),
      });

      await loadSavedCreations();
      
      // Clear error message on successful save
      setErrorMessage(null);
      
      // Reset form
      if (activeTab === 'story') {
        setStoryTitle('');
        setStoryContent('');
      } else if (activeTab === 'drawing') {
        setDrawingData('');
      } else {
        setCodeBlocks(['move_forward()', 'turn_left()']);
      }
    } catch (error: any) {
      let errorMsg = 'Failed to save. Please try again.';
      
      // Check if it's a content filter error
      const isContentFilterError = error.isContentFilterError || 
        error.message?.includes('not allowed') || 
        error.message?.includes('inappropriate') || 
        error.message?.includes('kind and appropriate');
      
      if (isContentFilterError) {
        // Don't log content filter errors to console - they're expected and handled gracefully
        errorMsg = 'Your content contains words that are not allowed. Please use kind and appropriate language.';
        setShowFilterModal(true);
      } else {
        // Only log unexpected errors
        console.error('Failed to save creation:', error);
        errorMsg = error.message || errorMsg;
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const addCodeBlock = (block: string) => {
    setCodeBlocks([...codeBlocks, block]);
  };

  const removeCodeBlock = (index: number) => {
    setCodeBlocks(codeBlocks.filter((_, i) => i !== index));
  };

  return (
    <>
      <ContentFilterModal
        isOpen={showFilterModal}
        onClose={() => {
          setShowFilterModal(false);
          setErrorMessage(null);
        }}
        message={errorMessage || undefined}
      />
      <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('story');
            setErrorMessage(null); // Clear error when switching tabs
          }}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'story'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500'
          }`}
        >
          📖 Story Builder
        </button>
        <button
          onClick={() => {
            setActiveTab('drawing');
            setErrorMessage(null); // Clear error when switching tabs
          }}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'drawing'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500'
          }`}
        >
          🎨 Drawing
        </button>
        <button
          onClick={() => {
            setActiveTab('code');
            setErrorMessage(null); // Clear error when switching tabs
          }}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'code'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500'
          }`}
        >
          💻 Code Blocks
        </button>
      </div>

      <Card className="p-6">
        {activeTab === 'story' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Story Title
              </label>
              <input
                type="text"
                placeholder="My Amazing Adventure"
                value={storyTitle}
                onChange={(e) => {
                  setStoryTitle(e.target.value);
                  setErrorMessage(null); // Clear error when user types
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Your Story
              </label>
              <textarea
                placeholder="Once upon a time..."
                value={storyContent}
                onChange={(e) => {
                  setStoryContent(e.target.value);
                  setErrorMessage(null); // Clear error when user types
                }}
                rows={12}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
            {errorMessage && (
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">⚠️ Content Not Allowed</p>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
                <p className="text-xs text-rose-600 mt-2">Please use kind and appropriate language. Your parent has been notified.</p>
              </div>
            )}
            <Button onClick={saveCreation} disabled={loading || !storyContent.trim()}>
              {loading ? 'Saving...' : '💾 Save Story'}
            </Button>
          </div>
        )}

        {activeTab === 'drawing' && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-slate-500 mb-4">🎨 Drawing Canvas</p>
              <p className="text-sm text-slate-400 mb-4">
                Click and drag to draw! (Simple canvas implementation)
              </p>
              <DrawingCanvas onSave={(data) => setDrawingData(data)} />
            </div>
            {errorMessage && (
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">⚠️ Content Not Allowed</p>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
                <p className="text-xs text-rose-600 mt-2">Please use kind and appropriate language. Your parent has been notified.</p>
              </div>
            )}
            <Button onClick={saveCreation} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Drawing'}
            </Button>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('move_forward()')}
              >
                ➡️ Move Forward
              </Button>
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('turn_left()')}
              >
                ↪️ Turn Left
              </Button>
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('turn_right()')}
              >
                ↩️ Turn Right
              </Button>
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('jump()')}
              >
                ⬆️ Jump
              </Button>
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('collect_item()')}
              >
                ⭐ Collect Item
              </Button>
              <Button
                variant="secondary"
                onClick={() => addCodeBlock('repeat(3)')}
              >
                🔁 Repeat 3x
              </Button>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Your Code:</p>
              {codeBlocks.map((block, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2 border border-slate-200"
                >
                  <code className="text-sm text-slate-700">{block}</code>
                  <button
                    onClick={() => removeCodeBlock(index)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {errorMessage && (
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">⚠️ Content Not Allowed</p>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
                <p className="text-xs text-rose-600 mt-2">Please use kind and appropriate language. Your parent has been notified.</p>
              </div>
            )}
            <Button onClick={saveCreation} disabled={loading || codeBlocks.length === 0}>
              {loading ? 'Saving...' : '💾 Save Code'}
            </Button>
          </div>
        )}
      </Card>

      {savedCreations.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-xl mb-4">Your Saved Creations</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {savedCreations.map((creation) => (
              <div
                key={creation.id}
                className="rounded-2xl border border-slate-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-700">{creation.title}</p>
                  <span className="text-xs text-slate-500">
                    {creation.type === 'STORY' ? '📖' : creation.type === 'DRAWING' ? '🎨' : '💻'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(creation.created_at).toLocaleDateString()}
                </p>
                {creation.type === 'STORY' && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {creation.content.substring(0, 100)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
    </>
  );
}

