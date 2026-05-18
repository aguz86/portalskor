export const emailService = {
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    bcc?: string | string[],
  ) {
    try {
      if (bcc && Array.isArray(bcc)) {
        if (bcc.length > 50) {
          const results = [];
          for (let i = 0; i < bcc.length; i += 50) {
            const batch = bcc.slice(i, i + 50);
            const res = await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to, bcc: batch, subject, html }),
            });
            results.push(await res.json());
          }
          return results;
        }
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, bcc, subject, html }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }
      return data;
    } catch (error) {
      console.error("Error sending email:", error);
      return null;
    }
  },
};
