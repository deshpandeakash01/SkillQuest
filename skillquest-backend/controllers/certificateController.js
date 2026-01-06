exports.issueCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { skillName } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // VERIFY: Has user completed this skill?
        if (!user.skillsCompleted.includes(skillName)) {
            return res.status(403).json({ msg: "You must complete the quiz with 60% score before claiming certificate." });
        }

        // Generate QR Code (As Buffer)
        const verificationData = JSON.stringify({
            user: user.name,
            skill: skillName,
            date: new Date().toISOString(),
            issuer: "SkillQuest"
        });

        // FIX: Use toBuffer instead of toDataURL to safely pass to pdfkit
        const qrCodeBuffer = await QRCode.toBuffer(verificationData);

        const doc = new PDFDocument({ layout: "landscape", size: "A4" });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Certificate-${skillName}.pdf`);

        doc.pipe(res);

        const width = doc.page.width;
        const height = doc.page.height;

        // --- BORDER ---
        // Outer Border
        doc.rect(20, 20, width - 40, height - 40)
            .lineWidth(3)
            .strokeColor("#1e293b") // Dark slate/black
            .stroke();

        // Inner Border
        doc.rect(28, 28, width - 56, height - 56)
            .lineWidth(1)
            .stroke();

        // Corner Ornaments (Simple Flourish Simulation)
        const drawCorner = (x, y, rotation) => {
            doc.save();
            doc.translate(x, y);
            doc.rotate(rotation);
            doc.moveTo(0, 0).lineTo(20, 0).lineTo(20, 5).lineTo(5, 5).lineTo(5, 20).lineTo(0, 20).fill("#1e293b");
            doc.restore();
        };
        drawCorner(24, 24, 0);       // Top-Left
        drawCorner(width - 24, 24, 90);    // Top-Right
        drawCorner(width - 24, height - 24, 180); // Bottom-Right
        drawCorner(24, height - 24, 270);  // Bottom-Left


        // --- TITLE ---
        doc.moveDown(3);
        doc.font("Times-Roman").fontSize(42).fillColor("#1e293b")
            .text("Certificate of Achievement", { align: "center" });

        doc.moveDown(0.5);
        doc.font("Times-Roman").fontSize(10).fillColor("#64748b").characterSpacing(2)
            .text("THE FOLLOWING AWARD IS GIVEN TO", { align: "center" });

        // --- RECIPIENT NAME ---
        doc.moveDown(1);
        doc.font("Times-Italic").fontSize(40).fillColor("#000000")
            .text(user.name, { align: "center" });

        // Underline name
        const nameWidth = doc.widthOfString(user.name);

        doc.moveDown(0.5);
        // Dashed line separator
        const lineY = doc.y;
        doc.moveTo(width / 2 - 150, lineY).lineTo(width / 2 + 150, lineY)
            .lineWidth(0.5).dash(3, { space: 3 }).strokeColor("#ccc").stroke().undash();


        // --- BODY ---
        doc.moveDown(1);
        doc.font("Times-Roman").fontSize(14).fillColor("#475569")
            .text("For successfully demonstrating proficiency and mastery in the skill of", { align: "center" });

        doc.moveDown(0.5);
        doc.font("Times-Bold").fontSize(24).fillColor("#8b5cf6") // Purple accent
            .text(skillName, { align: "center" });

        doc.moveDown(0.5);
        doc.font("Times-Italic").fontSize(12).fillColor("#64748b")
            .text("This certification acknowledges the dedication of the recipient.", { align: "center" });


        // --- BOTTOM SECTION (Seal & Signatures) ---
        const bottomY = height - 120;

        // Signature 1
        doc.fontSize(12).fillColor("#000").text("SkillQuest Team", 100, bottomY);
        doc.moveTo(100, bottomY - 5).lineTo(250, bottomY - 5).lineWidth(1).strokeColor("#000").stroke();
        doc.fontSize(10).fillColor("#64748b").text("Head of Evaluation", 100, bottomY + 15);

        // Signature 2 (Date)
        const dateStr = new Date().toLocaleDateString();
        doc.fontSize(12).fillColor("#000").text(dateStr, width - 250, bottomY);
        doc.moveTo(width - 250, bottomY - 5).lineTo(width - 100, bottomY - 5).stroke();
        doc.fontSize(10).fillColor("#64748b").text("Date", width - 250, bottomY + 15);

        // SEAL (Vector Polygon)
        doc.save();
        doc.translate(width / 2, bottomY - 10);
        // Draw starburst seal
        const spikes = 20;
        const outerRadius = 30;
        const innerRadius = 25;
        let angle = Math.PI / spikes;

        doc.path(`M 0 ${-outerRadius}`); // Start top
        for (let i = 0; i < spikes * 2; i++) {
            let r = (i % 2 === 0) ? outerRadius : innerRadius;
            let currA = i * angle;
            doc.lineTo(r * Math.sin(currA), -r * Math.cos(currA));
        }
        doc.closePath();
        doc.fill("#374151"); // Dark gray seal
        doc.restore();


        // --- QR CODE ---
        // Place QR Code in bottom corner area
        doc.image(qrCodeBuffer, width / 2 - 25, height - 130, { width: 50 });

        doc.end();

    } catch (err) {
        console.error(err);
        // If headers already sent, we can't send json.
        if (!res.headersSent) {
            res.status(500).json({ msg: "Certificate generation failed" });
        }
    }
};
