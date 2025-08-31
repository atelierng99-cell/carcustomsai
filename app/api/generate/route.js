import Replicate from "replicate";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const model = process.env.REPLICATE_MODEL;
    if (!replicateToken) return new Response("Missing REPLICATE_API_TOKEN", { status: 500 });
    if (!model) return new Response("Missing REPLICATE_MODEL", { status: 500 });

    const form = await req.formData();
    const file = form.get("image");
    const prompt = String(form.get("prompt") || "").trim();

    if (!(file instanceof File)) return new Response("No image uploaded", { status: 400 });
    if (!prompt) return new Response("Prompt is required", { status: 400 });

    const replicate = new Replicate({ auth: replicateToken });
    // upload file to Replicate temporary storage
    // @ts-ignore - SDK accepts web File in Node 18
    const imageUrl = await replicate.files.upload(file);

    const input = {
      image: imageUrl,
      prompt,
      num_inference_steps: 50,
      guidance_scale: 7,
      image_guidance_scale: 1.5
    };

    const output = await replicate.run(model, { input }); // array of URLs
    return new Response(JSON.stringify({ output }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(err?.message || "Server error", { status: 500 });
  }
}
