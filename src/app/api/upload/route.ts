import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { put } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";

export const runtime = "nodejs";

function canUseBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname: string) => {
        return {
          allowedContentTypes: ["image/*"],
          tokenPayload: JSON.stringify({ admin: true, pathname }),
        };
      },
      onUploadCompleted: async () => {
        // no-op
      },
    });
    return NextResponse.json(result);
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;

  if (canUseBlob()) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const fullPath = path.join(uploadsDir, filename);

  await fs.writeFile(fullPath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
