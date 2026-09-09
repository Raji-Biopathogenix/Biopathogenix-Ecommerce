# Persistent uploads on Railway

Product images use Django FileSystemStorage. The database stores their relative
filenames; the actual bytes are in MEDIA_ROOT. Database backups alone do not
preserve images. A successful product API response with a 404 at /media/... means
the record exists but the serving process cannot find the file at that location.

## Production setup

1. Before changing mounts or redeploying, copy any surviving uploads out of the
   current backend container. Mounting an empty volume does not copy old files.
2. Attach a persistent volume to the **Django backend service**, not the frontend
   or database. For this deployment, use mount path `/app/media` and set the
   backend service variable `MEDIA_ROOT=/app/media` explicitly.
3. Restore the saved media directory contents into that volume, preserving
   paths such as `products/2026/09/08/example.jpg`. Do not add another `media`
   subdirectory inside `/app/media`.
4. Deploy the backend with the volume attached. Upload a test image and confirm
   its `/media/...` URL returns 200. Redeploy again and check the same URL.
5. Enable Railway volume backups. Keep the volume attached across deployments.

An existing volume can be used instead: set MEDIA_ROOT to the directory on that
volume containing `products`, `categories`, and the other upload directories.
Changing MEDIA_ROOT alone does not create persistent storage or migrate files.
Do not mount over `/app`, which contains the application code.

The default remains `<backend directory>/media` for local development and
compatibility. Public URLs remain `/media/`; database image paths do not need
rewriting. `collectstatic` handles application assets, not uploaded media.

Files already removed from temporary storage must be restored from an upload
backup or uploaded again after persistent storage is configured. Do not rename
unrelated product photos to fill missing paths.

Railway documentation: https://docs.railway.com/volumes
