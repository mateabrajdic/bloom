"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function BloomHomeClient({ bloomStyles, bloomBody, bloomScript }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: bloomStyles }} />
      <div dangerouslySetInnerHTML={{ __html: bloomBody }} />
      <Script
        id="bloom-inline-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: bloomScript }}
      />
    </>
  );
}
