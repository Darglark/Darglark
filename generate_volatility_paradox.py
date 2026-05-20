from __future__ import annotations

import pathlib
import struct
from dataclasses import dataclass
from typing import Iterable


TICKS_PER_BEAT = 480
BEATS_PER_BAR = 4
TICKS_PER_BAR = TICKS_PER_BEAT * BEATS_PER_BAR
DEFAULT_OUTPUT_PATH = pathlib.Path("assets/volatility_paradox.mid")


@dataclass(frozen=True)
class NoteEvent:
    track: str
    bar: int
    start_tick: int
    duration: int
    pitch: int
    velocity: int
    channel: int
    shadow_reactive: bool = False


@dataclass(frozen=True)
class TrackLayout:
    events: tuple[NoteEvent, ...]
    ticks_per_beat: int = TICKS_PER_BEAT
    beats_per_bar: int = BEATS_PER_BAR
    total_bars: int = 32

    @property
    def ticks_per_bar(self) -> int:
        return self.ticks_per_beat * self.beats_per_bar


def build_volatility_paradox_layout() -> TrackLayout:
    events: list[NoteEvent] = []
    arpeggio_pitches = (64, 67, 71, 74, 76)
    hat_holes_by_bar = {
        25: (360, 1320),
        26: (240, 960, 1560),
        27: (120, 840, 1440),
        28: (0, 720, 1200, 1680),
        29: (0, 480, 960, 1440),
        30: (240, 480, 1080, 1320),
        31: (120, 600, 960, 1560),
        32: (0, 480, 960, 1440),
    }

    for bar in range(1, 25):
        for step in range(16):
            events.append(
                NoteEvent(
                    track="high_res_arpeggiator",
                    bar=bar,
                    start_tick=step * 120,
                    duration=90,
                    pitch=arpeggio_pitches[step % len(arpeggio_pitches)],
                    velocity=82,
                    channel=0,
                )
            )
        events.append(
            NoteEvent(
                track="low_res_sub_bass",
                bar=bar,
                start_tick=0,
                duration=TICKS_PER_BAR,
                pitch=36,
                velocity=94,
                channel=1,
            )
        )

    final_bar_note_counts = {25: 13, 26: 11, 27: 8, 28: 6, 29: 3, 30: 2, 31: 1, 32: 0}
    final_bar_velocity_peaks = {25: 88, 26: 78, 27: 66, 28: 54, 29: 38, 30: 28, 31: 18, 32: 0}

    for bar in range(25, 33):
        note_count = final_bar_note_counts[bar]
        peak_velocity = final_bar_velocity_peaks[bar]
        for fragment in range(note_count):
            start_tick = (fragment * 240 + (bar - 25) * 30) % TICKS_PER_BAR
            velocity = max(1, peak_velocity - fragment * 3)
            events.append(
                NoteEvent(
                    track="high_res_arpeggiator",
                    bar=bar,
                    start_tick=start_tick,
                    duration=max(45, 96 - (bar - 25) * 7),
                    pitch=arpeggio_pitches[(fragment + bar) % len(arpeggio_pitches)] + (fragment % 2) * 12,
                    velocity=velocity,
                    channel=0,
                )
            )

        for hole_tick in hat_holes_by_bar[bar]:
            events.append(
                NoteEvent(
                    track="hi_hat_gated_holes",
                    bar=bar,
                    start_tick=hole_tick,
                    duration=120,
                    pitch=42,
                    velocity=0,
                    channel=9,
                )
            )

        for hit_tick in range(0, TICKS_PER_BAR, 120):
            if hit_tick in hat_holes_by_bar[bar]:
                continue
            events.append(
                NoteEvent(
                    track="hi_hat_gate_hits",
                    bar=bar,
                    start_tick=hit_tick,
                    duration=45,
                    pitch=42,
                    velocity=72 if hit_tick % 240 else 88,
                    channel=9,
                )
            )

        sub_segments = _sub_bass_segments_for_bar(hat_holes_by_bar[bar])
        for start_tick, duration, shadow_reactive in sub_segments:
            events.append(
                NoteEvent(
                    track="low_res_sub_bass",
                    bar=bar,
                    start_tick=start_tick,
                    duration=duration,
                    pitch=34 if bar >= 29 else 36,
                    velocity=118 if shadow_reactive else 98,
                    channel=1,
                    shadow_reactive=shadow_reactive,
                )
            )

    return TrackLayout(events=tuple(sorted(events, key=lambda event: (event.bar, event.start_tick, event.track))))


def compile_volatility_paradox(output_path: pathlib.Path | str = DEFAULT_OUTPUT_PATH) -> pathlib.Path:
    if not isinstance(output_path, pathlib.Path | str):
        raise TypeError("output_path must be a pathlib.Path or string")

    destination = pathlib.Path(output_path)
    layout = build_volatility_paradox_layout()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(_encode_midi(layout))
    return destination


def _sub_bass_segments_for_bar(hole_ticks: Iterable[int]) -> list[tuple[int, int, bool]]:
    reactive_ticks = set(hole_ticks)
    segment_starts = sorted({0, TICKS_PER_BAR} | reactive_ticks)
    segments: list[tuple[int, int, bool]] = []

    for index, start_tick in enumerate(segment_starts[:-1]):
        end_tick = segment_starts[index + 1]
        if end_tick > start_tick:
            segments.append((start_tick, end_tick - start_tick, start_tick in reactive_ticks))

    if 0 in reactive_ticks:
        return segments

    return [(0, segment_starts[1], False), *segments[1:]]


def _encode_midi(layout: TrackLayout) -> bytes:
    track_events = {
        "high_res_arpeggiator": [event for event in layout.events if event.track == "high_res_arpeggiator"],
        "low_res_sub_bass": [event for event in layout.events if event.track == "low_res_sub_bass"],
        "hi_hat_gate_hits": [event for event in layout.events if event.track == "hi_hat_gate_hits"],
    }
    tracks = [_meta_track(layout), *(_note_track(name, events) for name, events in track_events.items())]
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), layout.ticks_per_beat)
    return header + b"".join(tracks)


def _meta_track(layout: TrackLayout) -> bytes:
    end_tick = layout.total_bars * layout.ticks_per_bar
    events = [
        (0, b"\xff\x03" + _variable_length_quantity(len(b"The Volatility Paradox")) + b"The Volatility Paradox"),
        (0, b"\xff\x51\x03\x07\xa1\x20"),
        (0, b"\xff\x58\x04\x04\x02\x18\x08"),
        (end_tick, b"\xff\x2f\x00"),
    ]
    return _track_chunk(events)


def _note_track(name: str, events: Iterable[NoteEvent]) -> bytes:
    midi_events: list[tuple[int, bytes]] = [
        (0, b"\xff\x03" + _variable_length_quantity(len(name.encode("ascii"))) + name.encode("ascii"))
    ]

    for event in events:
        if event.velocity <= 0:
            continue

        absolute_tick = (event.bar - 1) * TICKS_PER_BAR + event.start_tick
        note_on = bytes((0x90 | event.channel, event.pitch, event.velocity))
        note_off = bytes((0x80 | event.channel, event.pitch, 0))
        midi_events.append((absolute_tick, note_on))
        midi_events.append((absolute_tick + event.duration, note_off))

    midi_events.append((32 * TICKS_PER_BAR, b"\xff\x2f\x00"))
    return _track_chunk(midi_events)


def _track_chunk(events: Iterable[tuple[int, bytes]]) -> bytes:
    payload = bytearray()
    previous_tick = 0

    for absolute_tick, event_bytes in sorted(events, key=lambda item: item[0]):
        payload.extend(_variable_length_quantity(absolute_tick - previous_tick))
        payload.extend(event_bytes)
        previous_tick = absolute_tick

    return b"MTrk" + struct.pack(">I", len(payload)) + bytes(payload)


def _variable_length_quantity(value: int) -> bytes:
    if value < 0:
        raise ValueError("MIDI delta times must be non-negative")

    buffer = [value & 0x7F]
    value >>= 7
    while value:
        buffer.insert(0, (value & 0x7F) | 0x80)
        value >>= 7
    return bytes(buffer)


if __name__ == "__main__":
    compiled_path = compile_volatility_paradox()
    print(f"Compiled {compiled_path}")
