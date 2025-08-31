import Replicate from "replicate";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const model = process.env.REPLICATE_INPAINT_MODEL;
    if (!replicateToken) return new Response("Missing REPLICATE_API_TOKEN", { status: 500 });
    if (!model) return new Response("Missing REPLICATE_INPAINT_MODEL", { status: 500 });

    const form = await req.formData();
    const image = form.get("image");
    const mask = form.get("mask");
    const prompt = String(form.get("prompt") || "").trim();

    if (!(image instanceof File)) return new Response("No image uploaded", { status: 400 });
    if (!(mask instanceof File)) return new Response("No mask uploaded", { status: 400 });
    if (!prompt) return new Response("Prompt is required", { status: 400 });

    const replicate = new Replicate({ auth: replicateToken });
    // @ts-ignore
    const imageUrl = await replicate.files.upload(image);
    // @ts-ignore
    const maskUrl = await replicate.files.upload(mask);

    const input = {
      image: imageUrl,
      mask: maskUrl,
      prompt,
      num_inference_steps: 50,
      guidance_scale: 7,
      strength: 0.8
    };

    const output = await replicate.run(model, { input }); // array of URLs
    return new Response(JSON.stringify({ output }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(err?.message || "Server error", { status: 500 });
  }
}
