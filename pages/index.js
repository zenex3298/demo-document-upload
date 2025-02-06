import { useState } from 'react';

/**
 * Home component renders a document upload form.
 *
 * This component allows the user to select a file, submit it to the backend API,
 * and displays a message indicating the success or failure of the upload.
 *
 * @component
 * @returns {JSX.Element} The rendered upload form and message.
 */
export default function Home() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  /**
   * Handles the form submission event.
   *
   * Prevents the default form submission, appends the selected file to a FormData object,
   * and sends it via a POST request to the '/api/upload' endpoint.
   * The response message or error is then displayed.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div>
      <h1>Document Upload</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
