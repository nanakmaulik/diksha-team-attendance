"use client";

import { useState } from "react";

export default function CopyWhatsAppSummary({
  title = "WhatsApp Summary",
  message,
}: {
  title?: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = message;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }

  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900">
          {title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Is message ko copy karke WhatsApp group me bhej sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white shadow hover:bg-green-800"
        >
          {copied ? "Copied ✅" : "Copy Message"}
        </button>
      </div>

      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-zinc-900 p-4 text-sm text-white">
        {message}
      </pre>
    </div>
  );
}