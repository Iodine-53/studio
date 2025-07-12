
declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
  // Add other mammoth functions you might use here
}
