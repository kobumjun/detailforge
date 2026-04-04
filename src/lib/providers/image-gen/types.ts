export interface ImageGenInput {
  prompt: string;
  aspect?: "square" | "landscape" | "portrait";
}

export interface ImageGenProvider {
  generate(input: ImageGenInput): Promise<string>;
}
