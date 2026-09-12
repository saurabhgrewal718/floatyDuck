/**
 * The Apple silhouette for the download button.
 *
 * Note: Apple's own marketing guidelines reserve this mark for Apple, and prefer
 * third parties use the "Download on the Mac App Store" badge instead. Plenty of
 * indie Mac apps use it anyway on a direct-download button. Swap it for a plain
 * label if you would rather not.
 */
export function AppleMark({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.1 9.4c0-1.5.9-2.5 1.7-3-.5-.8-1.4-1.4-2.6-1.5-1.1-.1-2 .6-2.5.6-.5 0-1.3-.6-2.2-.6C5 4.9 3.4 6.2 3.4 9c0 1.8.6 3.7 1.5 4.9.7.9 1.3 1.7 2.2 1.7.9 0 1.2-.6 2.2-.6s1.3.6 2.2.6c.9 0 1.5-.8 2.1-1.7.4-.6.7-1.2.9-1.7-1.4-.5-2.4-1.6-2.4-2.8z" />
      <path d="M11.2 4.1c.5-.6.8-1.4.7-2.2-.7.1-1.6.5-2.1 1.1-.5.6-.8 1.4-.7 2.2.8.1 1.6-.4 2.1-1.1z" />
    </svg>
  );
}
