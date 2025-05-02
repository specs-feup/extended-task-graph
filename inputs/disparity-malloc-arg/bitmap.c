#include <stdio.h>
#include <stdlib.h>

// Function to read a BMP image and store it in an array of integers
int *readBMP(const char *filename, int *width, int *height)
{
    FILE *file = fopen(filename, "rb");
    if (file == NULL)
    {
        perror("Error opening file");
        return NULL;
    }

    unsigned char header[54];
    // Read the BMP file header
    if (fread(header, sizeof(unsigned char), 54, file) != 54)
    {
        perror("Error reading header");
        fclose(file);
        return NULL;
    }

    // Check the BMP magic number
    if (header[0] != 'B' || header[1] != 'M')
    {
        fprintf(stderr, "Not a valid BMP file\n");
        fclose(file);
        return NULL;
    }

    // Extract image width and height from header
    *width = *(int *)&header[18];
    *height = *(int *)&header[22];
    int bitCount = *(short *)&header[28];

    if (bitCount != 24)
    {
        fprintf(stderr, "Only 24-bit BMP files are supported\n");
        fclose(file);
        return NULL;
    }

    int size = (*width) * (*height);
    int *data = (int *)malloc(size * sizeof(int));
    if (data == NULL)
    {
        perror("Error allocating memory");
        fclose(file);
        return NULL;
    }

    // Calculate the padding bytes at the end of each row
    int row_padded = (*width * 3 + 3) & (~3);
    unsigned char *row = (unsigned char *)malloc(row_padded * sizeof(unsigned char));
    if (row == NULL)
    {
        perror("Error allocating memory for row");
        free(data);
        fclose(file);
        return NULL;
    }

    for (int i = 0; i < *height; i++)
    {
        // Read each row of pixels
        if (fread(row, sizeof(unsigned char), row_padded, file) != row_padded)
        {
            perror("Error reading pixel data");
            free(data);
            free(row);
            fclose(file);
            return NULL;
        }

        for (int j = 0; j < *width; j++)
        {
            // BMP stores pixels in BGR format
            unsigned char blue = row[j * 3];
            unsigned char green = row[j * 3 + 1];
            unsigned char red = row[j * 3 + 2];
            // Combine into a single integer (0xRRGGBB)
            data[(*height - i - 1) * (*width) + j] = (red << 16) | (green << 8) | blue;
        }
    }

    free(row);
    fclose(file);
    return data;
}

int writeBMP(const char *filename, int width, int height, int *data)
{
    FILE *file = fopen(filename, "wb");
    if (file == NULL)
    {
        perror("Error opening file");
        return -1;
    }

    unsigned char fileHeader[14] = {
        'B', 'M',   // Magic number
        0, 0, 0, 0, // File size
        0, 0,       // Reserved
        0, 0,       // Reserved
        54, 0, 0, 0 // Offset to start of pixel data
    };

    unsigned char infoHeader[40] = {
        40, 0, 0, 0, // Header size
        0, 0, 0, 0,  // Width
        0, 0, 0, 0,  // Height
        1, 0,        // Planes
        24, 0,       // Bits per pixel
        0, 0, 0, 0,  // Compression (no compression)
        0, 0, 0, 0,  // Image size (can be 0 for uncompressed)
        0, 0, 0, 0,  // X pixels per meter (not specified)
        0, 0, 0, 0,  // Y pixels per meter (not specified)
        0, 0, 0, 0,  // Total colors (0 means default)
        0, 0, 0, 0   // Important colors (0 means all are important)
    };

    int row_padded = (width * 3 + 3) & (~3);
    int fileSize = 54 + row_padded * height;
    fileHeader[2] = (unsigned char)(fileSize);
    fileHeader[3] = (unsigned char)(fileSize >> 8);
    fileHeader[4] = (unsigned char)(fileSize >> 16);
    fileHeader[5] = (unsigned char)(fileSize >> 24);

    infoHeader[4] = (unsigned char)(width);
    infoHeader[5] = (unsigned char)(width >> 8);
    infoHeader[6] = (unsigned char)(width >> 16);
    infoHeader[7] = (unsigned char)(width >> 24);

    infoHeader[8] = (unsigned char)(height);
    infoHeader[9] = (unsigned char)(height >> 8);
    infoHeader[10] = (unsigned char)(height >> 16);
    infoHeader[11] = (unsigned char)(height >> 24);

    fwrite(fileHeader, sizeof(unsigned char), 14, file);
    fwrite(infoHeader, sizeof(unsigned char), 40, file);

    unsigned char *row = (unsigned char *)malloc(row_padded * sizeof(unsigned char));
    if (row == NULL)
    {
        perror("Error allocating memory for row");
        fclose(file);
        return -1;
    }

    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            int pixel = data[(height - i - 1) * width + j];
            row[j * 3] = pixel & 0xFF;             // Blue
            row[j * 3 + 1] = (pixel >> 8) & 0xFF;  // Green
            row[j * 3 + 2] = (pixel >> 16) & 0xFF; // Red
        }
        fwrite(row, sizeof(unsigned char), row_padded, file);
    }

    free(row);
    fclose(file);
    return 0;
}