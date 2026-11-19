const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setShortUrl('');

  try {
    const formData = new FormData();
    formData.append('originalUrl', originalUrl);
    formData.append('description', description);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
      setUploading(true);
    }

    const res = await fetch('/api/create-url', {
      method: 'POST',
      body: formData, // jangan set Content-Type manual
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create short URL');
    }

    setShortUrl(data.shortUrl);
  } catch (err) {
    console.error(err);
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
    setUploading(false);
  }
};