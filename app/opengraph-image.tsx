import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WanderPool — Adventure Experiences in India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #085041 0%, #0F6E56 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          WanderPool
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#E1F5EE",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Book verified adventure experiences in India
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#EF9F27",
            marginTop: 36,
            letterSpacing: "2px",
          }}
        >
          RAFTING · TREKKING · PARAGLIDING · CAMPING
        </div>
      </div>
    ),
    { ...size }
  );
}
