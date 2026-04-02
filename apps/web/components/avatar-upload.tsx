'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui';
import { useTranslation } from '../contexts/locale-context';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (avatarDataUrl: string) => Promise<void>;
  onCancel: () => void;
}

export function AvatarUpload({ currentAvatar, onUpload, onCancel }: AvatarUploadProps) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(150);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState(150);
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isWheelActive = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage(result);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setCropSize(150);
      setCropPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img || !image) return;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image centered and scaled
    const imgAspect = img.width / img.height;
    const canvasAspect = containerWidth / containerHeight;

    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawWidth = containerWidth * scale;
      drawHeight = (containerWidth / imgAspect) * scale;
    } else {
      drawHeight = containerHeight * scale;
      drawWidth = containerHeight * imgAspect * scale;
    }

    const drawX = (containerWidth - drawWidth) / 2 + position.x;
    const drawY = (containerHeight - drawHeight) / 2 + position.y;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Draw overlay (darken outside crop area)
    const cropX = (containerWidth - cropSize) / 2 + cropPosition.x;
    const cropY = (containerHeight - cropSize) / 2 + cropPosition.y;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, containerWidth, cropY);
    ctx.fillRect(0, cropY, cropX, cropSize);
    ctx.fillRect(cropX + cropSize, cropY, containerWidth - cropX - cropSize, cropSize);
    ctx.fillRect(0, cropY + cropSize, containerWidth, containerHeight - cropY - cropSize);

    // Draw crop border
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cropX + cropSize / 3, cropY);
    ctx.lineTo(cropX + cropSize / 3, cropY + cropSize);
    ctx.moveTo(cropX + (cropSize * 2) / 3, cropY);
    ctx.lineTo(cropX + (cropSize * 2) / 3, cropY + cropSize);
    ctx.moveTo(cropX, cropY + cropSize / 3);
    ctx.lineTo(cropX + cropSize, cropY + cropSize / 3);
    ctx.moveTo(cropX, cropY + (cropSize * 2) / 3);
    ctx.lineTo(cropX + cropSize, cropY + (cropSize * 2) / 3);
    ctx.stroke();

    // Draw corner handles - bottom-right is pink for resize
    const handleSize = 10;
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(cropX + cropSize - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(cropX - handleSize / 2, cropY + cropSize - handleSize / 2, handleSize, handleSize);
    ctx.fillStyle = '#ff4081';
    ctx.fillRect(cropX + cropSize - handleSize / 2, cropY + cropSize - handleSize / 2, handleSize, handleSize);
  }, [image, scale, position, cropSize, cropPosition]);

  useEffect(() => {
    if (!image) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.src = image;
  }, [image, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Global wheel event handler to prevent page scroll when over canvas
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const isOverCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverCanvas && isWheelActive.current) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((s) => Math.min(Math.max(s * delta, 0.5), 5));
      }
    };

    document.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  const handleMouseEnter = () => {
    isWheelActive.current = true;
  };

  const handleMouseLeave = () => {
    isWheelActive.current = false;
  };

  const getCropCanvasCoords = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { centerX: 0, centerY: 0, cropX: 0, cropY: 0 };

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const cropX = centerX - cropSize / 2 + cropPosition.x;
    const cropY = centerY - cropSize / 2 + cropPosition.y;

    return { centerX, centerY, cropX, cropY };
  }, [cropSize, cropPosition]);

  const isOverResizeHandle = useCallback((clientX: number, clientY: number): boolean => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return false;

    const { cropX, cropY } = getCropCanvasCoords();
    const handleHitArea = 25;

    return (
      clientX >= rect.left + cropX + cropSize - handleHitArea &&
      clientX <= rect.left + cropX + cropSize + handleHitArea &&
      clientY >= rect.top + cropY + cropSize - handleHitArea &&
      clientY <= rect.top + cropY + cropSize + handleHitArea
    );
  }, [getCropCanvasCoords, cropSize]);

  const isInsideCropArea = useCallback((clientX: number, clientY: number): boolean => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return false;

    const { cropX, cropY } = getCropCanvasCoords();

    return (
      clientX >= rect.left + cropX &&
      clientX <= rect.left + cropX + cropSize &&
      clientY >= rect.top + cropY &&
      clientY <= rect.top + cropY + cropSize
    );
  }, [getCropCanvasCoords, cropSize]);

  const dragTargetRef = useRef<'crop' | 'image' | 'resize' | null>(null);
  const resizeStartCropPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if clicking on resize handle (bottom-right corner)
    if (isOverResizeHandle(e.clientX, e.clientY)) {
      setIsResizing(true);
      dragTargetRef.current = 'resize';
      setDragStart({ x: e.clientX, y: e.clientY });
      setResizeStartSize(cropSize);
      resizeStartCropPosRef.current = { x: cropPosition.x, y: cropPosition.y };
      return;
    }

    // Check if clicking inside crop area
    if (isInsideCropArea(e.clientX, e.clientY)) {
      setIsDragging(true);
      dragTargetRef.current = 'crop';
      setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
      return;
    }

    // Outside - pan image
    setIsDragging(true);
    dragTargetRef.current = 'image';
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update cursor based on hover state
    if (canvasRef.current && !isDragging && !isResizing) {
      if (isOverResizeHandle(e.clientX, e.clientY)) {
        canvasRef.current.style.cursor = 'se-resize';
      } else if (isInsideCropArea(e.clientX, e.clientY)) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'grab';
      }
    }

    if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // Use dominant axis for magnitude, sign from primary axis (deltaX for right/left)
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const delta = absDeltaX >= absDeltaY ? deltaX : deltaY;
      const newSize = Math.min(Math.max(resizeStartSize + delta, 80), 300);
      const sizeDiff = newSize - resizeStartSize;
      // Adjust cropPosition to keep top-left corner fixed
      setCropSize(newSize);
      setCropPosition({
        x: resizeStartCropPosRef.current.x + sizeDiff / 2,
        y: resizeStartCropPosRef.current.y + sizeDiff / 2,
      });
      return;
    }

    if (isDragging && dragTargetRef.current === 'crop') {
      setCropPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (isDragging && dragTargetRef.current === 'image') {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragTargetRef.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s * 0.8, 0.5));

  const getCroppedImage = (): string | null => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !image) return null;

    const rect = canvas.getBoundingClientRect();
    const { cropX, cropY } = getCropCanvasCoords();

    const imgAspect = img.width / img.height;
    const canvasAspect = rect.width / rect.height;

    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawWidth = rect.width * scale;
      drawHeight = (rect.width / imgAspect) * scale;
    } else {
      drawHeight = rect.height * scale;
      drawWidth = rect.height * imgAspect * scale;
    }

    const drawX = (rect.width - drawWidth) / 2 + position.x;
    const drawY = (rect.height - drawHeight) / 2 + position.y;

    const scaleX = img.width / drawWidth;
    const scaleY = img.height / drawHeight;

    const srcX = (cropX - drawX) * scaleX;
    const srcY = (cropY - drawY) * scaleY;
    const srcW = cropSize * scaleX;
    const srcH = cropSize * scaleY;

    const outputCanvas = document.createElement('canvas');
    const outputSize = 150;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

    let quality = 0.8;
    let dataUrl = outputCanvas.toDataURL('image/jpeg', quality);

    while (dataUrl.length > 500 * 1024 && quality > 0.3) {
      quality -= 0.1;
      dataUrl = outputCanvas.toDataURL('image/jpeg', quality);
    }

    return dataUrl;
  };

  const handleSave = async () => {
    const croppedData = getCroppedImage();
    if (!croppedData) return;

    setIsUploading(true);
    try {
      await onUpload(croppedData);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!image ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-600 rounded-xl p-8">
          <Upload className="h-12 w-12 text-zinc-500 mb-4" />
          <p className="text-zinc-400 text-base mb-4">{t('settings.profile.uploadAvatar')}</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload-input"
          />
          <label
            htmlFor="avatar-upload-input"
            className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2.5 text-base cursor-pointer transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
              color: '#0a0a0a',
              boxShadow: '0 0 15px rgba(0,229,255,0.3)',
            }}
          >
            {t('settings.profile.selectImage')}
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900 select-none"
            style={{ height: 350 }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full cursor-grab"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" icon={<ZoomOut className="h-4 w-4" />} onClick={handleZoomOut}>
              {t('settings.profile.zoomOut')}
            </Button>
            <span className="text-zinc-400 text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="secondary" size="sm" icon={<ZoomIn className="h-4 w-4" />} onClick={handleZoomIn}>
              {t('settings.profile.zoomIn')}
            </Button>
          </div>

          <p className="text-zinc-500 text-sm text-center">
            {t('settings.profile.cropHint')}
          </p>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setImage(null); onCancel(); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" loading={isUploading} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}