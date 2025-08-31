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

    // ✅ Compat: folosim .files.upload dacă există, altfel .upload
    let imageUrl;
    if (replicate.files && typeof replicate.files.upload === "function") {
      // @ts-ignore
      imageUrl = await replicate.files.upload(file);
    } else if (typeof replicate.upload === "function") {
      // @ts-ignore
      imageUrl = await replicate.upload(file);
    } else {
      return new Response("Replicate SDK: no upload method available", { status: 500 });
    }

    const input = {
      image: imageUrl,
      prompt,
      num_inference_steps: 50,
      guidance_scale: 7,
      image_guidance_scale: 1.5
    };

    const output = await replicate.run(model, { input });

    // ✅ Compat: output poate fi array de string-uri sau obiecte cu url()/url
    const urls = (output || []).map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      if (typeof item.url === "function") return item.url();
      if (typeof item.url === "string") return item.url;
      return null;
    }).filter(Boolean);

    return new Response(JSON.stringify({ output: urls }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(err);
    return new Response(err?.message || "Server error", { status: 500 });
  }
}


