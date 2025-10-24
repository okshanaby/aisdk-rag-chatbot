"use client";
import * as tf from "@tensorflow/tfjs";
import * as tflite from "@tensorflow/tfjs-tflite";
import { useEffect, useState } from "react";

import {
  Detection,
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

const useMobileFaceNet = () => {
  const [model, setModel] = useState<tflite.TFLiteModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [embedding, setEmbedding] = useState<Float32Array | null>(null);

  // DETECT FACE FROM IMAGE
  const detectFace = (image: HTMLImageElement | null) => {
    if (!image || !faceDetector) {
      alert("Please upload an image and wait for the model to load.");
      setIsLoading(false);
      return;
    }

    const detectionResult = faceDetector.detect(image);
    if (!detectionResult.detections?.length) {
      alert("No face detected.");
      setIsLoading(false);
      return;
    }

    setDetections(detectionResult.detections);
  };

  // GENERATE EMBEDDINGS
  async function generateEmbeddings(image: HTMLImageElement | null) {
    if (!image || !model) {
      alert("Please upload an image and wait for the model to load.");
      setIsLoading(false);
      return;
    }

    // The tf.tidy function automatically cleans up intermediate tensors
    const inputTensor = tf.tidy(() => {
      // 1. Convert image to tensor
      const tensor = tf.browser
        .fromPixels(image)
        .resizeBilinear([112, 112]) // Resize to MobileFaceNet standard input size
        .toFloat();

      // 2. Normalize to [-1, 1] range: (x / 127.5) - 1.0
      // This is the common normalization for MobileFaceNet
      const normalizedTensor = tensor.div(127.5).sub(1.0);

      // 3. Add batch dimension: [112, 112, 3] -> [1, 112, 112, 3]
      return normalizedTensor.expandDims(0);
    });

    try {
      // 4. Run prediction
      const outputTensor = model.predict(inputTensor) as tf.Tensor;

      // 5. Extract the raw embedding data from the Tensor
      const embeddingData = await outputTensor.data();

      console.log("Extracted Embeddings (Float32Array):", embeddingData);
      setEmbedding(embeddingData as Float32Array);

      // Clean up the output tensor (inputTensor is cleaned by tf.tidy)
      outputTensor.dispose();
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Prediction failed. See console for details.");
    } finally {
      inputTensor.dispose(); // Ensure the input is disposed outside of tf.tidy's automatic cleanup
    }
  }

  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);

      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        const _faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
        });

        setFaceDetector(_faceDetector);

        // LOAD MOBILE FACE-NATE MODEL
        await tf.ready();
        tflite.setWasmPath(
          "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.8/dist/"
        );

        const response = await fetch("/mobilefacenet.tflite");
        const modelBuffer = await response.arrayBuffer();
        console.log("Array buffer", modelBuffer);
        const model = await tflite.loadTFLiteModel(modelBuffer);

        setModel(model);
        console.log("TFLITE Loaded model from arraybuffer.", model);
      } catch (e) {
        // Handle errors here
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, []);

  return {
    model,
    isLoading,
    detectFace,
    detections,
    generateEmbeddings,
    embedding,
  };
};

export default useMobileFaceNet;
