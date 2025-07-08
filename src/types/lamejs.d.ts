
declare module 'lamejs' {
    export class Mp3Encoder {
        constructor(channels: number, sampleRate: number, bitRate: number);
        encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
        flush(): Int8Array;
    }
}

// Since `wav` might not have official types, provide a basic declaration
declare module 'wav' {
    export class Encoder {
        constructor(options: {
            audioFormat: number,
            channels: number,
            sampleRate: number,
            byteRate: number,
            blockAlign: number,
            bitDepth: number,
        });
        on(event: 'data', listener: (chunk: Buffer) => void): this;
        on(event: 'end', listener: () => void): this;
        end(buffer: Buffer): void;
    }
}

    