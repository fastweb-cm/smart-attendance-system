# app/services/fingerprint_service.py
from gi.repository import FPrint, GLib
import gi
gi.require_version('FPrint', '2.0')

_context = FPrint.Context()


def _get_device():
    _context.enumerate()
    devices = _context.get_devices()
    if not devices:
        raise RuntimeError("No fingerprint reader detected")
    return devices[0]


def capture_and_extract(timeout_s: int = 10) -> bytes:
    """
    Blocks until a finger is placed, captures, and returns a serialized
    FpPrint as bytes — this IS the "template" you store/compare.
    """
    device = _get_device()
    device.open_sync()
    try:
        print_obj = FPrint.Print.new(device)
        captured = device.capture_sync(True, print_obj, None)
        serialized = captured.serialize()
        return bytes(serialized)
    finally:
        device.close_sync()


def match_templates(template_a: bytes, template_b: bytes) -> tuple[bool, float]:
    """
    1:1 comparison. libfprint's compare_sync returns a bool match result
    directly (not a raw float score) — use that as your primary verified
    signal, and treat a match as high confidence.
    """
    print_a = FPrint.Print.deserialize(template_a)
    print_b = FPrint.Print.deserialize(template_b)
    matched, _ = FPrint.Print.compare_sync(print_a, print_b)
    return matched, (1.0 if matched else 0.0)


def identify(new_template: bytes, known_templates: dict[int, bytes]) -> tuple[int | None, float]:
    """
    1:N search using libfprint's native identify — compares against a
    gallery in a single call rather than looping match_templates yourself.
    """
    device = _get_device()
    new_print = FPrint.Print.deserialize(new_template)

    gallery = []
    id_map = {}
    for user_id, tmpl in known_templates.items():
        p = FPrint.Print.deserialize(tmpl)
        gallery.append(p)
        id_map[id(p)] = user_id

    device.open_sync()
    try:
        matched_print, matched = device.identify_sync(gallery, None)
    finally:
        device.close_sync()

    if matched and matched_print is not None:
        user_id = id_map.get(id(matched_print))
        return user_id, 1.0
    return None, 0.0
