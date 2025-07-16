import { useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const BookRegister = () => {
  const inputRef = useRef<HTMLInputElement>({} as HTMLInputElement);

  return (
    <div>
      <h1>Book Register</h1>
      <input ref={inputRef} type="file" accept=".pdf" />

      <button
        onClick={async () => {
          // TODO: Handle file upload and PDF processing
          if (inputRef.current.files && inputRef.current.files.length > 0) {
            const file = inputRef.current.files[0];

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
              .promise;

            console.log("PDF loaded:", pdf);
          }
        }}
      >
        Upload PDF
      </button>

      {/* Book details form */}
    </div>
  );
};

export default BookRegister;
