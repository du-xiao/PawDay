"use client";

import { useEffect, useRef, useState } from "react";

export function useImagePreview(initialUrl = "") {
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const objectUrlRef = useRef("");

  useEffect(() => {
    setPreviewUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function setPreviewFile(file?: File | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
    if (!file) {
      setPreviewUrl(initialUrl);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }

  function resetPreview(nextUrl = initialUrl) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
    setPreviewUrl(nextUrl);
  }

  return { previewUrl, setPreviewFile, resetPreview };
}
