import importlib.util
import pathlib
import sys
import unittest


sys.dont_write_bytecode = True
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
GENERATOR_PATH = PROJECT_ROOT / "generate_volatility_paradox.py"


def load_generator():
    if not GENERATOR_PATH.exists():
        raise AssertionError("generate_volatility_paradox.py should exist at the project root")

    spec = importlib.util.spec_from_file_location("generate_volatility_paradox", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("generate_volatility_paradox.py should be importable")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VolatilityParadoxLayoutTest(unittest.TestCase):
    def test_carapace_grid_disintegrates_arpeggiator_while_sub_bass_survives(self):
        generator = load_generator()

        layout = generator.build_volatility_paradox_layout()
        final_bars = range(25, 33)
        arpeggiator = [event for event in layout.events if event.track == "high_res_arpeggiator"]
        sub_bass = [event for event in layout.events if event.track == "low_res_sub_bass"]
        gated_holes = [event for event in layout.events if event.track == "hi_hat_gated_holes"]

        arpeggiator_counts = {
            bar: sum(1 for event in arpeggiator if event.bar == bar and event.velocity > 0) for bar in final_bars
        }
        arpeggiator_velocity_peaks = {
            bar: max((event.velocity for event in arpeggiator if event.bar == bar), default=0) for bar in final_bars
        }

        self.assertGreater(arpeggiator_counts[25], arpeggiator_counts[28])
        self.assertGreater(arpeggiator_counts[28], arpeggiator_counts[31])
        self.assertEqual(arpeggiator_counts[32], 0)
        self.assertGreater(arpeggiator_velocity_peaks[25], arpeggiator_velocity_peaks[31])
        self.assertEqual(arpeggiator_velocity_peaks[32], 0)

        sub_bass_bars = {event.bar for event in sub_bass if event.bar in final_bars}
        self.assertEqual(set(final_bars), sub_bass_bars)
        for bar in final_bars:
            bar_events = [event for event in sub_bass if event.bar == bar]
            self.assertGreaterEqual(sum(event.duration for event in bar_events), layout.ticks_per_bar)

        hole_positions = {(event.bar, event.start_tick) for event in gated_holes if event.bar in final_bars}
        sub_bass_shadow_positions = {
            (event.bar, event.start_tick) for event in sub_bass if event.bar in final_bars and event.shadow_reactive
        }
        self.assertEqual(hole_positions, sub_bass_shadow_positions)

    def test_compiler_writes_non_empty_midi_asset(self):
        generator = load_generator()
        output_path = PROJECT_ROOT / "assets" / "volatility_paradox.mid"

        if output_path.exists():
            output_path.unlink()

        written_path = generator.compile_volatility_paradox(output_path)

        self.assertEqual(output_path, written_path)
        self.assertTrue(output_path.exists())
        self.assertGreater(output_path.stat().st_size, 128)
        self.assertEqual(b"MThd", output_path.read_bytes()[:4])


if __name__ == "__main__":
    unittest.main()
