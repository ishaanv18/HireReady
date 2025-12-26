package com.hireready.service;

import com.hireready.exception.InvalidFileException;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;

@Slf4j
@Service
public class OCRService {

    @Value("${tesseract.data.path}")
    private String tesseractDataPath;

    @Value("${tesseract.language}")
    private String tesseractLanguage;

    /**
     * Extract text from image using Tesseract OCR
     */
    public String extractTextFromImage(MultipartFile imageFile) {
        try {
            Tesseract tesseract = new Tesseract();

            // Set Tesseract data path if configured
            if (tesseractDataPath != null && !tesseractDataPath.isEmpty()) {
                tesseract.setDatapath(tesseractDataPath);
            }

            tesseract.setLanguage(tesseractLanguage);

            // Convert MultipartFile to BufferedImage
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageFile.getBytes()));

            if (image == null) {
                throw new InvalidFileException("Invalid image file");
            }

            // Perform OCR
            String extractedText = tesseract.doOCR(image);

            log.info("Successfully extracted text from image: {} characters", extractedText.length());
            return extractedText;

        } catch (TesseractException e) {
            log.error("Tesseract OCR failed", e);
            throw new InvalidFileException("Failed to extract text from image: " + e.getMessage());
        } catch (IOException e) {
            log.error("Failed to read image file", e);
            throw new InvalidFileException("Failed to read image file: " + e.getMessage());
        }
    }

    /**
     * Check if file is an image
     */
    public boolean isImageFile(String contentType) {
        return contentType != null && (contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/bmp") ||
                contentType.equals("image/tiff"));
    }
}
