#!/data/data/com.termux/files/usr/bin/bash
set -e

ASSETS="/storage/emulated/0/Download/kp-assets"

APPICON="$ASSETS/app-icon-1024.png"
FG="$ASSETS/adaptive-foreground.png"
BG="$ASSETS/adaptive-background.png"
NOTI="$ASSETS/notification-icon.png"

for f in "$APPICON" "$FG" "$BG" "$NOTI"; do
  [ -f "$f" ] || { echo "Missing: $f"; exit 1; }
done

RES="android/app/src/main/res"

mkdir -p "$RES/mipmap-mdpi" "$RES/mipmap-hdpi" "$RES/mipmap-xhdpi" "$RES/mipmap-xxhdpi" "$RES/mipmap-xxxhdpi"
mkdir -p "$RES/mipmap-anydpi-v26"
mkdir -p "$RES/drawable"

# Legacy launcher icons
convert "$APPICON" -resize 48x48   "$RES/mipmap-mdpi/ic_launcher.png"
convert "$APPICON" -resize 72x72   "$RES/mipmap-hdpi/ic_launcher.png"
convert "$APPICON" -resize 96x96   "$RES/mipmap-xhdpi/ic_launcher.png"
convert "$APPICON" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher.png"
convert "$APPICON" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher.png"

# Round legacy (نفس الصورة)
cp "$RES/mipmap-mdpi/ic_launcher.png"    "$RES/mipmap-mdpi/ic_launcher_round.png"
cp "$RES/mipmap-hdpi/ic_launcher.png"    "$RES/mipmap-hdpi/ic_launcher_round.png"
cp "$RES/mipmap-xhdpi/ic_launcher.png"   "$RES/mipmap-xhdpi/ic_launcher_round.png"
cp "$RES/mipmap-xxhdpi/ic_launcher.png"  "$RES/mipmap-xxhdpi/ic_launcher_round.png"
cp "$RES/mipmap-xxxhdpi/ic_launcher.png" "$RES/mipmap-xxxhdpi/ic_launcher_round.png"

# Adaptive icon layers
convert "$FG" -resize 108x108 "$RES/mipmap-mdpi/ic_launcher_foreground.png"
convert "$FG" -resize 162x162 "$RES/mipmap-hdpi/ic_launcher_foreground.png"
convert "$FG" -resize 216x216 "$RES/mipmap-xhdpi/ic_launcher_foreground.png"
convert "$FG" -resize 324x324 "$RES/mipmap-xxhdpi/ic_launcher_foreground.png"
convert "$FG" -resize 432x432 "$RES/mipmap-xxxhdpi/ic_launcher_foreground.png"

convert "$BG" -resize 108x108 "$RES/mipmap-mdpi/ic_launcher_background.png"
convert "$BG" -resize 162x162 "$RES/mipmap-hdpi/ic_launcher_background.png"
convert "$BG" -resize 216x216 "$RES/mipmap-xhdpi/ic_launcher_background.png"
convert "$BG" -resize 324x324 "$RES/mipmap-xxhdpi/ic_launcher_background.png"
convert "$BG" -resize 432x432 "$RES/mipmap-xxxhdpi/ic_launcher_background.png"

# Adaptive XML
cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" <<'XML'
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
XML

cat > "$RES/mipmap-anydpi-v26/ic_launcher_round.xml" <<'XML'
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
XML

# Notification icon (white mono)
convert "$NOTI" -resize 96x96 "$RES/drawable/ic_stat_king.png"

echo "OK: icons generated under android/app/src/main/res"
