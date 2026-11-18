# Image Permissions Record

IMAGE_PERMISSION: not_granted

## Status
As specified in the Bodywise Match design requirements and catalog rules, the default permission status is `not_granted` when explicit written authorization has not been provided.

- Brand images must NOT be downloaded, copied, hotlinked, or embedded.
- Product listings maintain `image_url: null` and render the neutral fallback placeholder.
- Image page references (`image_source_page`) are retained for audit and verification purposes only.
