"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import useMobileFaceNet from "./useMobileFaceNet";

export default function UploadFace() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const { isLoading, detectFace, detections, generateEmbeddings, embedding } =
    useMobileFaceNet();

  const inputRef = useRef<HTMLInputElement>(null);

  // 📸 Handle image selection
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    setImage(img);
  };

  return (
    <div className="p-4 flex flex-col items-center gap-3 w-1/3 mx-auto pt-10">
      <Input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        accept="image/*"
      />

      {image && (
        <img
          src={image.src}
          alt="Uploaded face"
          className="w-48 rounded-lg border border-gray-300"
        />
      )}
      <div className="flex justify-center gap-4 items-center">
        <Button
          onClick={() => detectFace(image)}
          disabled={isLoading || !image}
          className={`px-4 py-2 rounded-lg text-white transition-colors ${
            isLoading || !image
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader />
              Processing...
            </span>
          ) : (
            "Detect Face"
          )}
        </Button>

        <Button
          onClick={() => generateEmbeddings(image)}
          disabled={isLoading || !detections?.length}
          className={`px-4 py-2 rounded-lg text-white transition-colors ${
            isLoading || !image || !detections?.length
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 cursor-pointer"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader />
              Processing...
            </span>
          ) : (
            "Generate Embeddings"
          )}
        </Button>
      </div>

      {detections && (
        <p className="text-green-600 text-sm">
          Detected {detections.length} face(s)
        </p>
      )}

      <hr className="w-full" />

      {embedding && (
        <div className="w-full">
          <h2 className="text-lg font-semibold mb-2">
            Extracted Face Embedding:
          </h2>
          <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded">
            {/* Display the first few elements and the length */}
            Length: <strong>{embedding.length}</strong> <br />
            Vector (First 10 values): [
            {Array.from(embedding)
              .slice(0, 10)
              .map(v => Number(v).toFixed(4))
              .join(", ")}
            , ...]
          </p>
          <p className="mt-2 text-sm text-gray-600">
            This vector is the numerical representation of the face, ready for
            similarity comparison.
          </p>
        </div>
      )}
    </div>
  );
}

const Loader = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);
