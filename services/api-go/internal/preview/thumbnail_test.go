package preview

import (
	"image"
	"image/color"
	"image/jpeg"
	"os"
	"path/filepath"
	"testing"
)

func TestCreateJPEGThumbnail(t *testing.T) {
	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "src.jpg")
	srcFile, err := os.Create(srcPath)
	if err != nil {
		t.Fatalf("create source file: %v", err)
	}
	img := image.NewRGBA(image.Rect(0, 0, 1200, 800))
	for y := 0; y < 800; y++ {
		for x := 0; x < 1200; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x % 255), G: uint8(y % 255), B: 120, A: 255})
		}
	}
	if err := jpeg.Encode(srcFile, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatalf("encode source image: %v", err)
	}
	if err := srcFile.Close(); err != nil {
		t.Fatalf("close source file: %v", err)
	}

	out, err := CreateJPEGThumbnail(srcPath, 320, 200)
	if err != nil {
		t.Fatalf("create thumbnail: %v", err)
	}
	if len(out) == 0 {
		t.Fatalf("thumbnail should not be empty")
	}
}
