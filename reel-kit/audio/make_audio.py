"""Generate Outlook Styles' own sound effects + 120 BPM music beds (100% original, no copyright).
Usage: python3 make_audio.py   -> writes sfx/*.wav and music/*.wav (+ .mp3 if ffmpeg is present)
"""
import os, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a, d, curve=4.0):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-curve * np.linspace(0, 1, n - na) * (1 / max(d, 1e-3)) * (n - na) / SR) if n > na else 1
    return e
def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def norm(x, peak=.89): m = np.max(np.abs(x)) or 1; return x / m * peak
def stereo(x, w=0.0):
    d = int(SR * .012 * w); r = np.concatenate([np.zeros(d), x])[:len(x)] if d else x
    return np.stack([x, r], 1)
def reverb(x, secs=1.6, mix=.22):
    n = int(SR * secs); ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 6, n)); ir = lp(ir, 6000)
    wet = fftconvolve(x, ir)[:len(x)]; wet = wet / (np.max(np.abs(wet)) or 1) * np.max(np.abs(x))
    return x * (1 - mix) + wet * mix
def save(name, x, folder):
    os.makedirs(os.path.join(HERE, folder), exist_ok=True)
    x = x if x.ndim == 2 else stereo(x)
    p = os.path.join(HERE, folder, name + '.wav'); wavfile.write(p, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    try:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-b:a', '256k', p[:-4] + '.mp3'], check=True)
    except Exception:
        pass
    print('wrote', folder + '/' + name)

# ------------------------------------------------------------------ SFX
def whoosh(d=.6, lo=300, hi=6000, rev=False):
    n = int(SR * d); x = rng.standard_normal(n)
    sweep = np.geomspace(lo, hi, n); out = np.zeros(n); blk = 512
    for i in range(0, n, blk):
        f = sweep[i]; out[i:i + blk] = bp(x[i:i + blk + 0], max(60, f * .6), min(SR / 2 - 100, f * 1.6))[:len(out[i:i + blk])]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    y = out * e
    return norm(y[::-1] if rev else y, .8)
def pop():
    t = t_(.18); f = 900 * np.exp(-t * 28) + 180
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)
    y[:200] += rng.standard_normal(200) * np.linspace(1, 0, 200) * .4
    return norm(y, .85)
def boom():
    t = t_(1.1); f = 90 * np.exp(-t * 4) + 38
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    hit = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 30) * .7
    return norm(reverb(np.tanh(1.6 * (sub + hit)), 1.2, .15), .9)
def chime():
    y = np.zeros(int(SR * 1.6))
    for k, f in enumerate([1568, 2093, 2637, 3136]):
        t = t_(1.6 - k * .06); s = int(k * .06 * SR)
        tone = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3.5)
        y[s:s + len(t)] += tone * .5
    return norm(reverb(y, 2.0, .35), .7)
def click():
    t = t_(.06); y = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 200) * .3
    return norm(y, .75)
def riser(d=1.5):
    t = t_(d); n = len(t)
    noise = hp(rng.standard_normal(n), 800) * np.linspace(0, 1, n) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(200, 1400, n)) / SR) * np.linspace(0, 1, n) ** 3 * .5
    return norm(reverb(noise * .6 + tone, 1.0, .2), .8)
def shimmer():
    t = t_(1.0); y = np.zeros(len(t))
    for i in range(18):
        s = int(rng.uniform(0, .6) * SR); f = rng.uniform(3000, 7000); tt = t_(.25)
        seg = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18) * rng.uniform(.3, 1)
        y[s:s + len(seg)] += seg[:len(y) - s]
    return norm(reverb(y, 1.4, .4), .6)

# ------------------------------------------------------------------ MUSIC (120 BPM, 4/4)
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
def kick(v=1.0):
    t = t_(.4); f = 140 * np.exp(-t * 30) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * v
def clap(v=.6):
    t = t_(.25); n = bp(rng.standard_normal(len(t)), 900, 4000) * np.exp(-t * 22)
    return reverb(n, .5, .25) * v
def hat(v=.25, open_=False):
    t = t_(.22 if open_ else .06); return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70)) * v
def saw(f, d, cut=2500, v=.2):
    t = t_(d); ph = (f * t) % 1; x = (2 * ph - 1) + (2 * ((f * 1.006 * t) % 1) - 1)
    return lp(x, cut) * v
def sine(f, d, v=.3): t = t_(d); return np.sin(2 * np.pi * f * t) * v
def place(buf, x, at):
    s = int(at * SR); e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s]

def track(name, chords, bars=10, style='house'):
    L = int(SR * (bars * BAR + 1.0)); drums, bass, keys, pump = (np.zeros(L) for _ in range(4))
    for b in range(bars):
        root, triad = chords[b % len(chords)]
        t0 = b * BAR
        for q in range(4):
            bt = t0 + q * BEAT
            if style != 'soft' or q in (0, 2): place(drums, kick(1 if style != 'soft' else .8), bt)
            if q in (1, 3): place(drums, clap(.55 if style == 'house' else .45), bt)
            place(drums, hat(.22, open_=style == 'house'), bt + BEAT / 2)
            if style == 'house': place(drums, hat(.12), bt + BEAT / 4); place(drums, hat(.12), bt + 3 * BEAT / 4)
        # bass: root on 8ths (house) / long notes (others)
        if style == 'house':
            for e in range(8):
                if e % 2: place(bass, lp(saw(NOTE(root - 24), BEAT / 2 * .9, 400, .5), 300), t0 + e * BEAT / 2)
        else:
            place(bass, sine(NOTE(root - 24), BAR * .95, .5) * env(int(SR * BAR * .95), .02, 3, 1.5), t0)
        # chords: stabs (house) / pad (lux) / arp (soft)
        if style == 'house':
            for st in (0, 1.5, 2.5):
                ch = sum(saw(NOTE(n), BEAT * .45, 3200, .09) for n in triad); place(keys, ch * env(len(ch), .005, 1.5, 3), t0 + st * BEAT)
        elif style == 'lux':
            ch = sum(saw(NOTE(n), BAR, 1400, .07) for n in triad); place(keys, ch * env(len(ch), .25, 3, .8), t0)
        else:
            for i in range(8):
                n = triad[i % 3] + (12 if i >= 4 else 0)
                tn = sine(NOTE(n), BEAT * .6, .18) + sine(NOTE(n) * 2, BEAT * .6, .05)
                place(keys, tn * env(len(tn), .003, 1, 6), t0 + i * BEAT / 2)
        for q in range(4):  # sidechain pump on every beat
            s = int((t0 + q * BEAT) * SR); n = int(BEAT * SR)
            pump[s:s + n] = 1 - .55 * np.exp(-np.linspace(0, 6, n))
    pump[pump == 0] = 1
    keys = reverb(keys, 1.8, .3) * pump; bass = bass * pump
    mix = drums * .9 + bass + keys
    mix = np.tanh(mix * 1.3) * .9
    n = len(mix); fade = int(SR * .8); mix[-fade:] *= np.linspace(1, 0, fade); mix[:int(SR * .05)] *= np.linspace(0, 1, int(SR * .05))
    L_ = mix + .0; R_ = reverb(mix, .3, .08)
    save(name, norm(np.stack([L_, R_], 1), .89), 'music')

if __name__ == '__main__':
    save('whoosh', whoosh(.55), 'sfx'); save('whoosh-long', whoosh(1.0, 200, 8000), 'sfx')
    save('swoosh-reverse', whoosh(.5, 400, 7000, rev=True), 'sfx')
    save('pop', pop(), 'sfx'); save('boom-slam', boom(), 'sfx'); save('chime', chime(), 'sfx')
    save('click', click(), 'sfx'); save('riser', riser(), 'sfx'); save('shimmer', shimmer(), 'sfx')
    A, F, C, G = (57, (69, 72, 76)), (53, (65, 69, 72)), (48, (64, 67, 72)), (55, (67, 71, 74))
    D, Bb = (50, (62, 65, 69)), (46, (62, 65, 70))
    track('01-colour-pop-house-120bpm', [A, F, C, G], style='house')
    track('02-luxe-night-120bpm', [D, Bb, F, C], style='lux')
    track('03-soft-glam-120bpm', [C, G, A, F], style='soft')
