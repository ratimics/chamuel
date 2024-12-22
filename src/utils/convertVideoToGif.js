import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import axios from 'axios';

export async function convertVideoToGif(videoUrl) {
    const tempDir = join(tmpdir(), 'video-conversions');
    const tempVideoPath = join(tempDir, `${randomUUID()}.mp4`);
    const tempPalettePath = join(tempDir, `${randomUUID()}.png`);
    const tempGifPath = join(tempDir, `${randomUUID()}.gif`);
    
    try {
        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });
        
        // Download video from URL
        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'arraybuffer'
        });
        
        // Write video buffer to temporary file
        await fs.writeFile(tempVideoPath, Buffer.from(response.data));

        // First pass: Generate optimized palette
        await new Promise((resolve, reject) => {
            ffmpeg(tempVideoPath)
                .outputOptions([
                    // Reduced color palette, optimized for size
                    '-vf', 'fps=12,scale=320:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff'
                ])
                .save(tempPalettePath)
                .on('end', resolve)
                .on('error', (err) => reject(new Error(`Palette generation failed: ${err.message}`)));
        });

        // Second pass: Generate optimized GIF
        await new Promise((resolve, reject) => {
            ffmpeg(tempVideoPath)
                .input(tempPalettePath)
                .outputOptions([
                    // Optimized settings for smaller file size
                    '-lavfi', [
                        // Lower framerate, smaller size, better compression
                        'fps=12,scale=320:-1:flags=lanczos[x]',
                        // Dithering and compression optimization
                        '[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle'
                    ].join(','),
                    '-t', '6'  // Limit to 6 seconds
                ])
                .save(tempGifPath)
                .on('end', resolve)
                .on('error', (err) => reject(new Error(`GIF generation failed: ${err.message}`)));
        });
        
        // Read the resulting GIF into a buffer
        const gifBuffer = await fs.readFile(tempGifPath);
        return gifBuffer;

    } catch (error) {
        console.error('Error in convertVideoToGif:', error);
        throw new Error(`Failed to convert video to gif: ${error.message}`);
    } finally {
        // Clean up temporary files
        const filesToClean = [tempVideoPath, tempPalettePath, tempGifPath];
        for (const file of filesToClean) {
            try {
                await fs.unlink(file).catch(() => {});
            } catch (error) {
                console.warn(`Failed to clean up temporary file ${file}:`, error);
            }
        }
        
        try {
            await fs.rmdir(tempDir).catch(() => {});
        } catch (error) {
            // Ignore error if directory is not empty
        }
    }
}