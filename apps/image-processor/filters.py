"""
Engine de edição de fotos com filtros baseados nos parâmetros do Lightroom (DNG).
Traduz parâmetros XMP para operações de imagem com Pillow + NumPy.
"""
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import colorsys
import math
import io
import json
import os
from pathlib import Path

# ── Definição dos filtros extraídos dos DNG ──────────────────────────────────
FILTERS: dict[str, dict] = {
    "efeito-1": {
        "id": "efeito-1",
        "name": "Efeito 1 — Suave Pastel",
        "description": "Tons suaves, vibrância elevada, sombras abertas. Ideal para ambientes claros.",
        "params": {
            "exposure": 0.39,
            "contrast": 0,
            "highlights": -100,
            "shadows": 59,
            "whites": -76,
            "blacks": -4,
            "texture": 0,
            "clarity": -5,
            "dehaze": 0,
            "vibrance": 40,
            "saturation": 0,
            "sharpness": 35,
            "luminance_smoothing": 12,
            "vignette": 0,
            "grain_amount": 35,
            "grain_size": 13,
            "temperature_shift": 1,
            "tint_shift": -9,
            "hue": {"red": 5, "orange": 0, "yellow": -21, "green": 34, "aqua": 2, "blue": 25},
            "saturation_hsl": {"red": -33, "orange": -18, "yellow": -17, "green": -32, "aqua": -37, "blue": -13},
            "luminance_hsl": {"red": 0, "orange": 10, "yellow": 44, "green": 38, "aqua": 0, "blue": -23},
        }
    },
    "efeito-2": {
        "id": "efeito-2",
        "name": "Efeito 2 — Vibrante Moderno",
        "description": "Alta vibrância, textura realçada, dehaze para clareza. Perfeito para exteriores.",
        "params": {
            "exposure": 0.74,
            "contrast": -46,
            "highlights": -35,
            "shadows": 22,
            "whites": -82,
            "blacks": -39,
            "texture": 33,
            "clarity": -1,
            "dehaze": 21,
            "vibrance": 75,
            "saturation": 10,
            "sharpness": 59,
            "luminance_smoothing": 0,
            "vignette": -2,
            "grain_amount": 0,
            "grain_size": 13,
            "temperature_shift": -4,
            "tint_shift": 2,
            "hue": {"red": 0, "orange": 0, "yellow": 0, "green": 0, "aqua": 0, "blue": 0},
            "saturation_hsl": {"red": 0, "orange": 0, "yellow": 0, "green": 0, "aqua": 0, "blue": 0},
            "luminance_hsl": {"red": 0, "orange": 0, "yellow": 0, "green": 0, "aqua": 0, "blue": 0},
        }
    },
    "efeito-3": {
        "id": "efeito-3",
        "name": "Efeito 3 — Quente Natural",
        "description": "Tons quentes, sombras abertas, céu azul intenso. Ideal para fotos de dia.",
        "params": {
            "exposure": 0.80,
            "contrast": -52,
            "highlights": -23,
            "shadows": 49,
            "whites": -57,
            "blacks": 44,
            "texture": 23,
            "clarity": 19,
            "dehaze": 29,
            "vibrance": 26,
            "saturation": 12,
            "sharpness": 53,
            "luminance_smoothing": 56,
            "vignette": -7,
            "grain_amount": 13,
            "grain_size": 25,
            "temperature_shift": 5,
            "tint_shift": 1,
            "hue": {"red": -6, "orange": -12, "yellow": -25, "green": 2, "aqua": 10, "blue": -17},
            "saturation_hsl": {"red": 0, "orange": 26, "yellow": -75, "green": 30, "aqua": -14, "blue": 60},
            "luminance_hsl": {"red": 0, "orange": -13, "yellow": 15, "green": -47, "aqua": 0, "blue": -8},
        }
    },
    # ── Presets Profissionais para Fotografia Imobiliária ──────────────────────
    "hdr-interior": {
        "id": "hdr-interior",
        "name": "HDR Interior",
        "description": "Sombras abertas, destaques controlados. Perfeito para ambientes internos com janelas.",
        "params": {
            "exposure": 0.55, "contrast": 15, "highlights": -80, "shadows": 65,
            "whites": -40, "blacks": 20, "texture": 20, "clarity": 15,
            "dehaze": 10, "vibrance": 25, "saturation": 5, "sharpness": 45,
            "luminance_smoothing": 15, "vignette": 0, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": 2, "tint_shift": 0,
            "hue": {"red": 0, "orange": -5, "yellow": -10, "green": 0, "aqua": 0, "blue": 0},
            "saturation_hsl": {"red": -10, "orange": 5, "yellow": -5, "green": -10, "aqua": 0, "blue": 0},
            "luminance_hsl": {"red": 0, "orange": 10, "yellow": 20, "green": 0, "aqua": 0, "blue": 0},
        }
    },
    "magazine": {
        "id": "magazine",
        "name": "Magazine Editorial",
        "description": "Alto contraste limpo, cores precisas. Padrão de revistas de arquitetura.",
        "params": {
            "exposure": 0.30, "contrast": 20, "highlights": -50, "shadows": 30,
            "whites": -20, "blacks": -10, "texture": 25, "clarity": 20,
            "dehaze": 15, "vibrance": 15, "saturation": 0, "sharpness": 55,
            "luminance_smoothing": 0, "vignette": -5, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": 0, "tint_shift": 0,
            "hue": {"red": 0, "orange": 0, "yellow": 0, "green": 0, "aqua": 0, "blue": 0},
            "saturation_hsl": {"red": -5, "orange": 0, "yellow": -10, "green": -5, "aqua": 5, "blue": 5},
            "luminance_hsl": {"red": 0, "orange": 5, "yellow": 10, "green": 0, "aqua": 0, "blue": -5},
        }
    },
    "luxury-premium": {
        "id": "luxury-premium",
        "name": "Luxo Premium",
        "description": "Tons ricos e quentes, sensação de sofisticação. Ideal para imóveis de alto padrão.",
        "params": {
            "exposure": 0.25, "contrast": 10, "highlights": -40, "shadows": 35,
            "whites": -30, "blacks": 5, "texture": 15, "clarity": 10,
            "dehaze": 5, "vibrance": 20, "saturation": 8, "sharpness": 40,
            "luminance_smoothing": 10, "vignette": -12, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": 4, "tint_shift": -3,
            "hue": {"red": -5, "orange": -8, "yellow": -10, "green": 0, "aqua": 0, "blue": 5},
            "saturation_hsl": {"red": -5, "orange": 10, "yellow": -10, "green": -15, "aqua": -5, "blue": 0},
            "luminance_hsl": {"red": 0, "orange": 8, "yellow": 15, "green": 5, "aqua": 0, "blue": -10},
        }
    },
    "fresh-bright": {
        "id": "fresh-bright",
        "name": "Fresh & Bright",
        "description": "Ultra brilhante e arejado. Popular em plataformas como Airbnb e Viva Real.",
        "params": {
            "exposure": 0.85, "contrast": -30, "highlights": -60, "shadows": 50,
            "whites": -50, "blacks": 30, "texture": 10, "clarity": -5,
            "dehaze": 0, "vibrance": 30, "saturation": 5, "sharpness": 30,
            "luminance_smoothing": 20, "vignette": 0, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": 1, "tint_shift": 0,
            "hue": {"red": 0, "orange": 0, "yellow": -5, "green": 5, "aqua": 0, "blue": 0},
            "saturation_hsl": {"red": -15, "orange": -5, "yellow": -10, "green": -5, "aqua": 0, "blue": 0},
            "luminance_hsl": {"red": 5, "orange": 15, "yellow": 25, "green": 10, "aqua": 5, "blue": 0},
        }
    },
    "twilight": {
        "id": "twilight",
        "name": "Twilight / Blue Hour",
        "description": "Céu azul profundo com interior quente iluminado. Perfeito para fotos ao entardecer.",
        "params": {
            "exposure": 0.40, "contrast": 15, "highlights": -30, "shadows": 40,
            "whites": -25, "blacks": 10, "texture": 20, "clarity": 15,
            "dehaze": 20, "vibrance": 45, "saturation": 10, "sharpness": 50,
            "luminance_smoothing": 10, "vignette": -8, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": -6, "tint_shift": 5,
            "hue": {"red": 0, "orange": -10, "yellow": -15, "green": 0, "aqua": 5, "blue": 10},
            "saturation_hsl": {"red": -10, "orange": 15, "yellow": -20, "green": -10, "aqua": 20, "blue": 30},
            "luminance_hsl": {"red": 5, "orange": 10, "yellow": 15, "green": 0, "aqua": -5, "blue": -15},
        }
    },
    "cinematic": {
        "id": "cinematic",
        "name": "Cinematográfico",
        "description": "Tom de filme, contraste dramático. Excelente para vídeos e tours virtuais.",
        "params": {
            "exposure": 0.20, "contrast": 25, "highlights": -45, "shadows": 25,
            "whites": -35, "blacks": -15, "texture": 15, "clarity": 20,
            "dehaze": 10, "vibrance": 10, "saturation": -5, "sharpness": 40,
            "luminance_smoothing": 5, "vignette": -15, "grain_amount": 8,
            "grain_size": 20, "temperature_shift": 2, "tint_shift": -2,
            "hue": {"red": -5, "orange": -8, "yellow": -10, "green": 5, "aqua": 5, "blue": 10},
            "saturation_hsl": {"red": -10, "orange": -5, "yellow": -15, "green": -10, "aqua": 5, "blue": 10},
            "luminance_hsl": {"red": 0, "orange": 5, "yellow": 10, "green": -5, "aqua": 0, "blue": -10},
        }
    },
    "exterior-vivid": {
        "id": "exterior-vivid",
        "name": "Exterior Vívido",
        "description": "Cores vibrantes para fachadas, gramados verdes e céu azul.",
        "params": {
            "exposure": 0.45, "contrast": 5, "highlights": -55, "shadows": 35,
            "whites": -35, "blacks": 10, "texture": 30, "clarity": 20,
            "dehaze": 25, "vibrance": 55, "saturation": 10, "sharpness": 55,
            "luminance_smoothing": 5, "vignette": 0, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": -2, "tint_shift": 0,
            "hue": {"red": 0, "orange": 0, "yellow": -10, "green": 15, "aqua": 10, "blue": 5},
            "saturation_hsl": {"red": -5, "orange": 0, "yellow": -5, "green": 25, "aqua": 15, "blue": 20},
            "luminance_hsl": {"red": 0, "orange": 5, "yellow": 10, "green": -10, "aqua": -5, "blue": -5},
        }
    },
    "pool-leisure": {
        "id": "pool-leisure",
        "name": "Piscina & Lazer",
        "description": "Água azul cristalina, verdes vibrantes. Perfeito para áreas de lazer.",
        "params": {
            "exposure": 0.50, "contrast": 10, "highlights": -45, "shadows": 30,
            "whites": -30, "blacks": 15, "texture": 25, "clarity": 15,
            "dehaze": 20, "vibrance": 60, "saturation": 15, "sharpness": 50,
            "luminance_smoothing": 10, "vignette": 0, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": -3, "tint_shift": 2,
            "hue": {"red": 0, "orange": 0, "yellow": -5, "green": 10, "aqua": 15, "blue": 10},
            "saturation_hsl": {"red": -15, "orange": -5, "yellow": -10, "green": 20, "aqua": 35, "blue": 25},
            "luminance_hsl": {"red": 0, "orange": 5, "yellow": 10, "green": -5, "aqua": -10, "blue": -8},
        }
    },
    "drone-aerial": {
        "id": "drone-aerial",
        "name": "Vista Aérea / Drone",
        "description": "Clareza máxima, céu dramático, detalhes nítidos para fotos de drone.",
        "params": {
            "exposure": 0.35, "contrast": 15, "highlights": -60, "shadows": 25,
            "whites": -30, "blacks": 5, "texture": 35, "clarity": 25,
            "dehaze": 30, "vibrance": 40, "saturation": 8, "sharpness": 60,
            "luminance_smoothing": 0, "vignette": 0, "grain_amount": 0,
            "grain_size": 0, "temperature_shift": -1, "tint_shift": 0,
            "hue": {"red": 0, "orange": 0, "yellow": -5, "green": 10, "aqua": 5, "blue": 0},
            "saturation_hsl": {"red": -5, "orange": 0, "yellow": -5, "green": 15, "aqua": 10, "blue": 15},
            "luminance_hsl": {"red": 0, "orange": 0, "yellow": 5, "green": -10, "aqua": -5, "blue": -10},
        }
    },
    "night-elegant": {
        "id": "night-elegant",
        "name": "Noturna Elegante",
        "description": "Iluminação quente noturna, sombras ricas. Para fotos de fachada à noite.",
        "params": {
            "exposure": 0.70, "contrast": 20, "highlights": -30, "shadows": 55,
            "whites": -20, "blacks": 25, "texture": 15, "clarity": 10,
            "dehaze": 5, "vibrance": 20, "saturation": 5, "sharpness": 40,
            "luminance_smoothing": 25, "vignette": -10, "grain_amount": 5,
            "grain_size": 15, "temperature_shift": 6, "tint_shift": -2,
            "hue": {"red": -5, "orange": -8, "yellow": -10, "green": 0, "aqua": 5, "blue": 10},
            "saturation_hsl": {"red": -5, "orange": 10, "yellow": -10, "green": -10, "aqua": 5, "blue": 15},
            "luminance_hsl": {"red": 5, "orange": 10, "yellow": 15, "green": 5, "aqua": 0, "blue": -5},
        }
    },
}

# ── Funções de conversão ─────────────────────────────────────────────────────

def lr_to_factor(lr_value: float, scale: float = 100.0) -> float:
    """Converte valor Lightroom (-100..+100) para fator multiplicativo."""
    return 1.0 + (lr_value / scale)

def apply_exposure(img_array: np.ndarray, ev: float) -> np.ndarray:
    """Aplica exposição em EV (stops). +1 EV = 2x mais brilho."""
    factor = 2 ** ev
    result = img_array.astype(np.float32) * factor
    return np.clip(result, 0, 255).astype(np.uint8)

def apply_contrast(img_array: np.ndarray, contrast_lr: float) -> np.ndarray:
    """Aplica contraste no estilo Lightroom (S-curve suave)."""
    if contrast_lr == 0:
        return img_array
    # Mapeia -100..+100 para -0.5..+0.5 de ajuste de contraste PIL
    factor = 1.0 + (contrast_lr / 200.0)
    img = Image.fromarray(img_array)
    enhancer = ImageEnhance.Contrast(img)
    return np.array(enhancer.enhance(factor))

def apply_highlights_shadows(img_array: np.ndarray, highlights: float, shadows: float) -> np.ndarray:
    """
    Ajusta highlights e shadows de forma seletiva.
    Highlights afeta apenas pixels acima de 128, shadows abaixo de 128.
    """
    arr = img_array.astype(np.float32)
    # Máscara de highlights (pixels claros)
    hl_mask = (arr / 255.0) ** 2  # quadrático: mais peso nos claros
    # Máscara de shadows (pixels escuros)
    sh_mask = (1.0 - arr / 255.0) ** 2  # mais peso nos escuros
    
    hl_adj = (highlights / 100.0) * 50  # max ±50 pixels
    sh_adj = (shadows / 100.0) * 50
    
    arr = arr + hl_mask * hl_adj + sh_mask * sh_adj
    return np.clip(arr, 0, 255).astype(np.uint8)

def apply_whites_blacks(img_array: np.ndarray, whites: float, blacks: float) -> np.ndarray:
    """Ajusta o ponto branco e preto."""
    arr = img_array.astype(np.float32)
    # Whites: afeta apenas pixels muito claros (>200)
    white_mask = np.clip((arr - 200) / 55.0, 0, 1)
    # Blacks: afeta apenas pixels muito escuros (<55)
    black_mask = np.clip((55 - arr) / 55.0, 0, 1)
    
    arr = arr + white_mask * (whites / 100.0 * 30)
    arr = arr + black_mask * (blacks / 100.0 * 30)
    return np.clip(arr, 0, 255).astype(np.uint8)

def apply_vibrance_saturation(img_array: np.ndarray, vibrance: float, saturation: float) -> np.ndarray:
    """
    Vibrance: aumenta saturação de cores menos saturadas (mais inteligente que saturation).
    Saturation: aumenta saturação de todas as cores uniformemente.
    """
    img = Image.fromarray(img_array).convert('HSV')
    hsv = np.array(img).astype(np.float32)
    
    # Saturation global
    if saturation != 0:
        sat_factor = 1.0 + (saturation / 100.0)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * sat_factor, 0, 255)
    
    # Vibrance: boost em pixels menos saturados
    if vibrance != 0:
        sat_norm = hsv[:, :, 1] / 255.0  # 0..1
        # Peso inverso: mais boost para pixels menos saturados
        weight = (1.0 - sat_norm) * (vibrance / 100.0) * 0.5
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] + weight * 255, 0, 255)
    
    result = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
    return np.array(result)

def apply_temperature_tint(img_array: np.ndarray, temp_shift: float, tint_shift: float) -> np.ndarray:
    """
    Temperatura: shift incremental (positivo = mais quente/amarelo, negativo = mais frio/azul).
    Tint: shift incremental (positivo = mais magenta, negativo = mais verde).
    """
    arr = img_array.astype(np.float32)
    # Temperatura: afeta canais R e B inversamente
    # Escala: cada unidade LR ≈ 0.3 pixel de ajuste
    temp_factor = temp_shift * 0.3
    arr[:, :, 0] = np.clip(arr[:, :, 0] + temp_factor, 0, 255)  # R
    arr[:, :, 2] = np.clip(arr[:, :, 2] - temp_factor, 0, 255)  # B
    
    # Tint: afeta canais G e R/B
    tint_factor = tint_shift * 0.2
    arr[:, :, 1] = np.clip(arr[:, :, 1] - tint_factor, 0, 255)  # G (negativo = mais magenta)
    
    return np.clip(arr, 0, 255).astype(np.uint8)

def apply_hsl_adjustments(img_array: np.ndarray, hue_adj: dict, sat_adj: dict, lum_adj: dict) -> np.ndarray:
    """
    Ajustes HSL por faixa de cor (Red, Orange, Yellow, Green, Aqua, Blue).
    Converte para HSV, aplica ajustes por faixa de matiz, converte de volta.
    """
    # Faixas de matiz (0-360) para cada cor
    HUE_RANGES = {
        'red':    (345, 15),   # vermelho (wrap-around)
        'orange': (15, 45),
        'yellow': (45, 75),
        'green':  (75, 165),
        'aqua':   (165, 210),
        'blue':   (210, 270),
        'purple': (270, 315),
        'magenta':(315, 345),
    }
    
    img = Image.fromarray(img_array).convert('RGB')
    pixels = np.array(img).astype(np.float32) / 255.0
    
    result = np.zeros_like(pixels)
    
    for y in range(pixels.shape[0]):
        for x in range(pixels.shape[1]):
            r, g, b = pixels[y, x]
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            h_deg = h * 360
            
            # Determinar qual faixa de cor
            for color, (lo, hi) in HUE_RANGES.items():
                if color == 'red':
                    in_range = h_deg >= lo or h_deg <= hi
                else:
                    in_range = lo <= h_deg <= hi
                
                if in_range:
                    # Peso baseado na proximidade ao centro da faixa
                    if color == 'red':
                        center = 0
                        dist = min(abs(h_deg - 360), abs(h_deg - 0))
                    else:
                        center = (lo + hi) / 2
                        dist = abs(h_deg - center)
                    
                    range_half = (hi - lo) / 2 if color != 'red' else 15
                    weight = max(0, 1 - dist / range_half)
                    
                    # Aplicar ajustes
                    h_shift = hue_adj.get(color, 0) / 360.0 * weight
                    s_shift = sat_adj.get(color, 0) / 100.0 * weight * 0.5
                    l_shift = lum_adj.get(color, 0) / 100.0 * weight * 0.3
                    
                    h = (h + h_shift) % 1.0
                    s = np.clip(s + s_shift, 0, 1)
                    v = np.clip(v + l_shift, 0, 1)
                    break
            
            r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
            result[y, x] = [r2, g2, b2]
    
    return (result * 255).astype(np.uint8)

def apply_hsl_fast(img_array: np.ndarray, hue_adj: dict, sat_adj: dict, lum_adj: dict) -> np.ndarray:
    """
    Versão vetorizada (rápida) dos ajustes HSL.
    Usa NumPy para processar todos os pixels de uma vez.
    """
    # Verificar se há ajustes a aplicar
    all_zero = all(v == 0 for v in {**hue_adj, **sat_adj, **lum_adj}.values())
    if all_zero:
        return img_array
    
    # Converter para float 0..1
    arr = img_array.astype(np.float32) / 255.0
    
    # Converter RGB para HSV vetorizado
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin
    
    # Hue (0-360)
    h = np.zeros_like(r)
    mask = delta > 0
    
    # Red max
    m = mask & (cmax == r)
    h[m] = 60 * (((g[m] - b[m]) / delta[m]) % 6)
    # Green max
    m = mask & (cmax == g)
    h[m] = 60 * ((b[m] - r[m]) / delta[m] + 2)
    # Blue max
    m = mask & (cmax == b)
    h[m] = 60 * ((r[m] - g[m]) / delta[m] + 4)
    
    # Saturation (0-1)
    s = np.where(cmax > 0, delta / cmax, 0)
    # Value (0-1)
    v = cmax
    
    # Faixas de cor
    HUE_RANGES = {
        'orange': (15, 45),
        'yellow': (45, 75),
        'green':  (75, 165),
        'aqua':   (165, 210),
        'blue':   (210, 270),
    }
    
    for color, (lo, hi) in HUE_RANGES.items():
        center = (lo + hi) / 2
        half = (hi - lo) / 2
        
        dist = np.abs(h - center)
        weight = np.clip(1 - dist / half, 0, 1)
        weight = weight * (s > 0.05)  # só afeta pixels com alguma saturação
        
        h_shift = hue_adj.get(color, 0) / 360.0
        s_shift = sat_adj.get(color, 0) / 100.0 * 0.5
        l_shift = lum_adj.get(color, 0) / 100.0 * 0.3
        
        h = (h + h_shift * weight * 360) % 360
        s = np.clip(s + s_shift * weight, 0, 1)
        v = np.clip(v + l_shift * weight, 0, 1)
    
    # Red (wrap-around: >345 ou <15)
    red_mask = ((h > 345) | (h < 15)) & (s > 0.05)
    h_shift_r = hue_adj.get('red', 0) / 360.0
    s_shift_r = sat_adj.get('red', 0) / 100.0 * 0.5
    l_shift_r = lum_adj.get('red', 0) / 100.0 * 0.3
    h = np.where(red_mask, (h + h_shift_r * 360) % 360, h)
    s = np.where(red_mask, np.clip(s + s_shift_r, 0, 1), s)
    v = np.where(red_mask, np.clip(v + l_shift_r, 0, 1), v)
    
    # Converter HSV de volta para RGB
    h_norm = h / 360.0
    i = (h_norm * 6).astype(int)
    f = h_norm * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    
    i = i % 6
    r2 = np.select([i==0, i==1, i==2, i==3, i==4, i==5], [v, q, p, p, t, v])
    g2 = np.select([i==0, i==1, i==2, i==3, i==4, i==5], [t, v, v, q, p, p])
    b2 = np.select([i==0, i==1, i==2, i==3, i==4, i==5], [p, p, t, v, v, q])
    
    result = np.stack([r2, g2, b2], axis=2)
    return (np.clip(result, 0, 1) * 255).astype(np.uint8)

def apply_clarity_texture(img_array: np.ndarray, clarity: float, texture: float) -> np.ndarray:
    """
    Clarity: micro-contraste de médio alcance (unsharp mask com raio grande).
    Texture: micro-contraste de pequeno alcance (detalhes finos).
    """
    if clarity == 0 and texture == 0:
        return img_array
    
    img = Image.fromarray(img_array)
    result = np.array(img).astype(np.float32)
    
    if clarity != 0:
        # Clarity: unsharp mask com raio grande (15px)
        blurred = np.array(img.filter(ImageFilter.GaussianBlur(radius=15))).astype(np.float32)
        mask = result - blurred
        result = result + mask * (clarity / 100.0) * 0.5
    
    if texture != 0:
        # Texture: unsharp mask com raio pequeno (3px)
        blurred_s = np.array(img.filter(ImageFilter.GaussianBlur(radius=3))).astype(np.float32)
        mask_s = result - blurred_s
        result = result + mask_s * (texture / 100.0) * 0.3
    
    return np.clip(result, 0, 255).astype(np.uint8)

def apply_dehaze(img_array: np.ndarray, dehaze: float) -> np.ndarray:
    """
    Dehaze: remove névoa/neblina aumentando contraste e saturação nas áreas claras.
    """
    if dehaze == 0:
        return img_array
    
    arr = img_array.astype(np.float32)
    factor = dehaze / 100.0
    
    # Aumenta contraste global levemente
    mean = arr.mean()
    arr = mean + (arr - mean) * (1 + factor * 0.3)
    
    # Aumenta saturação
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1 + factor * 0.4)
    
    return np.array(img)

def apply_sharpness(img_array: np.ndarray, sharpness_lr: float) -> np.ndarray:
    """Aplica nitidez. Lightroom 0-150, PIL 1.0 = sem mudança."""
    if sharpness_lr <= 25:
        return img_array
    # Normaliza: LR 25 = sem mudança, 100 = moderado, 150 = forte
    factor = 1.0 + (sharpness_lr - 25) / 125.0 * 2.0
    img = Image.fromarray(img_array)
    enhancer = ImageEnhance.Sharpness(img)
    return np.array(enhancer.enhance(factor))

def apply_vignette(img_array: np.ndarray, amount: float) -> np.ndarray:
    """Aplica vinheta (escurecimento das bordas). amount negativo = escurece bordas."""
    if amount == 0:
        return img_array
    
    h, w = img_array.shape[:2]
    # Criar máscara de vinheta elíptica
    Y, X = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    # Distância normalizada do centro (0 = centro, 1 = canto)
    dist = np.sqrt(((X - cx) / cx) ** 2 + ((Y - cy) / cy) ** 2)
    
    # amount negativo = escurece bordas (típico)
    strength = abs(amount) / 100.0
    if amount < 0:
        mask = 1 - np.clip(dist * strength, 0, strength)
    else:
        mask = 1 + np.clip((dist - 0.5) * strength, 0, strength * 0.5)
    
    mask = np.clip(mask, 0, 1.5)
    result = img_array.astype(np.float32) * mask[:, :, np.newaxis]
    return np.clip(result, 0, 255).astype(np.uint8)

def apply_grain(img_array: np.ndarray, amount: float, size: float, frequency: float) -> np.ndarray:
    """Adiciona grão fotográfico."""
    if amount == 0:
        return img_array
    
    h, w = img_array.shape[:2]
    # Gerar ruído gaussiano
    noise_strength = amount / 100.0 * 15  # max 15 pixels de ruído
    noise = np.random.normal(0, noise_strength, (h, w, 1)).astype(np.float32)
    
    # Aplicar blur no ruído para simular tamanho do grão
    if size > 10:
        noise_img = Image.fromarray(np.clip(noise[:,:,0] + 128, 0, 255).astype(np.uint8))
        blur_radius = max(0.5, (size - 10) / 20.0)
        noise_img = noise_img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        noise = (np.array(noise_img).astype(np.float32) - 128)[:, :, np.newaxis]
    
    result = img_array.astype(np.float32) + noise
    return np.clip(result, 0, 255).astype(np.uint8)

def apply_luminance_smoothing(img_array: np.ndarray, amount: float) -> np.ndarray:
    """Redução de ruído de luminância (suavização)."""
    if amount < 10:
        return img_array
    radius = amount / 100.0 * 2.0  # max 2px de blur
    img = Image.fromarray(img_array)
    return np.array(img.filter(ImageFilter.GaussianBlur(radius=radius)))

# ── Função principal de aplicação do filtro ──────────────────────────────────

def apply_filter(img: Image.Image, filter_id: str, custom_params: dict = None) -> Image.Image:
    """
    Aplica um filtro completo a uma imagem PIL.
    
    Args:
        img: Imagem PIL (RGB)
        filter_id: ID do filtro ('efeito-1', 'efeito-2', 'efeito-3' ou 'custom')
        custom_params: Parâmetros customizados (para filtros importados)
    
    Returns:
        Imagem PIL processada
    """
    if custom_params:
        params = custom_params
    elif filter_id in FILTERS:
        params = FILTERS[filter_id]['params']
    else:
        raise ValueError(f"Filtro '{filter_id}' não encontrado")
    
    # Garantir RGB
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    arr = np.array(img)
    
    # 1. Temperatura e Tint
    arr = apply_temperature_tint(arr, params.get('temperature_shift', 0), params.get('tint_shift', 0))
    
    # 2. Exposição
    arr = apply_exposure(arr, params.get('exposure', 0))
    
    # 3. Contraste
    arr = apply_contrast(arr, params.get('contrast', 0))
    
    # 4. Highlights e Shadows
    arr = apply_highlights_shadows(arr, params.get('highlights', 0), params.get('shadows', 0))
    
    # 5. Whites e Blacks
    arr = apply_whites_blacks(arr, params.get('whites', 0), params.get('blacks', 0))
    
    # 6. Clarity e Texture
    arr = apply_clarity_texture(arr, params.get('clarity', 0), params.get('texture', 0))
    
    # 7. Dehaze
    arr = apply_dehaze(arr, params.get('dehaze', 0))
    
    # 8. Vibrance e Saturation
    arr = apply_vibrance_saturation(arr, params.get('vibrance', 0), params.get('saturation', 0))
    
    # 9. Ajustes HSL por cor
    hue_adj = params.get('hue', {})
    sat_adj = params.get('saturation_hsl', {})
    lum_adj = params.get('luminance_hsl', {})
    if any(v != 0 for v in {**hue_adj, **sat_adj, **lum_adj}.values()):
        arr = apply_hsl_fast(arr, hue_adj, sat_adj, lum_adj)
    
    # 10. Nitidez
    arr = apply_sharpness(arr, params.get('sharpness', 25))
    
    # 11. Redução de ruído
    arr = apply_luminance_smoothing(arr, params.get('luminance_smoothing', 0))
    
    # 12. Vinheta
    arr = apply_vignette(arr, params.get('vignette', 0))
    
    # 13. Grão
    arr = apply_grain(arr, params.get('grain_amount', 0), params.get('grain_size', 13), params.get('grain_frequency', 9))
    
    return Image.fromarray(arr)


# ── Marca d'água (Logo) ───────────────────────────────────────────────────────

def apply_watermark(img: Image.Image, logo_path: str, position: str = 'bottom-right', opacity: float = 0.85) -> Image.Image:
    """
    Aplica logo como marca d'água na foto do imóvel.
    
    O logo é redimensionado para ~6% da menor dimensão da foto (nunca muito grande/pequeno).
    Posição padrão: canto inferior direito com margem.
    """
    if not os.path.exists(logo_path):
        return img
    
    # Carregar logo
    logo = Image.open(logo_path).convert('RGBA')
    
    # Calcular tamanho ideal do logo
    # Regra: logo ocupa ~6% da menor dimensão da foto
    img_w, img_h = img.size
    min_dim = min(img_w, img_h)
    target_size = int(min_dim * 0.06)  # 6% da menor dimensão
    
    # Limitar: mínimo 40px, máximo 120px
    target_size = max(40, min(120, target_size))
    
    # Redimensionar logo mantendo proporção
    logo_w, logo_h = logo.size
    ratio = min(target_size / logo_w, target_size / logo_h)
    new_w = int(logo_w * ratio)
    new_h = int(logo_h * ratio)
    logo = logo.resize((new_w, new_h), Image.LANCZOS)
    
    # Aplicar opacidade
    if opacity < 1.0:
        logo_arr = np.array(logo).astype(np.float32)
        logo_arr[:, :, 3] = logo_arr[:, :, 3] * opacity
        logo = Image.fromarray(logo_arr.astype(np.uint8))
    
    # Calcular posição
    margin = int(min_dim * 0.02)  # 2% de margem
    margin = max(10, min(30, margin))
    
    positions = {
        'bottom-right': (img_w - new_w - margin, img_h - new_h - margin),
        'bottom-left':  (margin, img_h - new_h - margin),
        'top-right':    (img_w - new_w - margin, margin),
        'top-left':     (margin, margin),
        'center':       ((img_w - new_w) // 2, (img_h - new_h) // 2),
    }
    pos = positions.get(position, positions['bottom-right'])
    
    # Compor imagem
    result = img.convert('RGBA')
    result.paste(logo, pos, logo)
    return result.convert('RGB')


# ── Funções de preview e processamento ───────────────────────────────────────

def generate_preview(image_bytes: bytes, filter_id: str, custom_params: dict = None,
                     logo_path: str = None, logo_position: str = 'bottom-right',
                     preview_width: int = 800) -> bytes:
    """
    Gera um preview da imagem com o filtro aplicado.
    Retorna bytes JPEG do resultado.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Redimensionar para preview (mais rápido)
    w, h = img.size
    if w > preview_width:
        ratio = preview_width / w
        img = img.resize((preview_width, int(h * ratio)), Image.LANCZOS)
    
    # Aplicar filtro
    img = apply_filter(img, filter_id, custom_params)
    
    # Aplicar logo se fornecido
    if logo_path:
        img = apply_watermark(img, logo_path, logo_position)
    
    # Salvar como JPEG
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    return output.getvalue()


def process_image(image_bytes: bytes, filter_id: str, custom_params: dict = None,
                  logo_path: str = None, logo_position: str = 'bottom-right',
                  output_quality: int = 92) -> bytes:
    """
    Processa uma imagem em qualidade completa com o filtro e logo.
    Retorna bytes JPEG do resultado.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Aplicar filtro
    img = apply_filter(img, filter_id, custom_params)
    
    # Aplicar logo se fornecido
    if logo_path:
        img = apply_watermark(img, logo_path, logo_position)
    
    # Salvar como JPEG de alta qualidade
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=output_quality, optimize=True)
    return output.getvalue()


def extract_filter_from_dng(dng_path: str, filter_name: str = None) -> dict:
    """
    Extrai parâmetros de um arquivo DNG do Lightroom e retorna um dict de filtro.
    """
    import subprocess
    result = subprocess.run(['exiftool', '-XMP:all', '-n', dng_path], capture_output=True, text=True)
    
    raw = {}
    for line in result.stdout.split('\n'):
        if ':' in line:
            key, _, val = line.partition(':')
            key = key.strip()
            val = val.strip()
            if val:
                try:
                    raw[key] = float(val) if '.' in val else int(val)
                except ValueError:
                    raw[key] = val
    
    # Mapear para nosso formato
    params = {
        'exposure':            raw.get('Exposure 2012', 0),
        'contrast':            raw.get('Contrast 2012', 0),
        'highlights':          raw.get('Highlights 2012', 0),
        'shadows':             raw.get('Shadows 2012', 0),
        'whites':              raw.get('Whites 2012', 0),
        'blacks':              raw.get('Blacks 2012', 0),
        'texture':             raw.get('Texture', 0),
        'clarity':             raw.get('Clarity 2012', 0),
        'dehaze':              raw.get('Dehaze', 0),
        'vibrance':            raw.get('Vibrance', 0),
        'saturation':          raw.get('Saturation', 0),
        'sharpness':           raw.get('Sharpness', 25),
        'luminance_smoothing': raw.get('Luminance Smoothing', 0),
        'vignette':            raw.get('Post Crop Vignette Amount', 0),
        'grain_amount':        raw.get('Grain Amount', 0),
        'grain_size':          raw.get('Grain Size', 13),
        'grain_frequency':     raw.get('Grain Frequency', 9),
        'temperature_shift':   raw.get('Incremental Temperature', 0),
        'tint_shift':          raw.get('Incremental Tint', 0),
        'hue': {
            'red':     raw.get('Hue Adjustment Red', 0),
            'orange':  raw.get('Hue Adjustment Orange', 0),
            'yellow':  raw.get('Hue Adjustment Yellow', 0),
            'green':   raw.get('Hue Adjustment Green', 0),
            'aqua':    raw.get('Hue Adjustment Aqua', 0),
            'blue':    raw.get('Hue Adjustment Blue', 0),
        },
        'saturation_hsl': {
            'red':     raw.get('Saturation Adjustment Red', 0),
            'orange':  raw.get('Saturation Adjustment Orange', 0),
            'yellow':  raw.get('Saturation Adjustment Yellow', 0),
            'green':   raw.get('Saturation Adjustment Green', 0),
            'aqua':    raw.get('Saturation Adjustment Aqua', 0),
            'blue':    raw.get('Saturation Adjustment Blue', 0),
        },
        'luminance_hsl': {
            'red':     raw.get('Luminance Adjustment Red', 0),
            'orange':  raw.get('Luminance Adjustment Orange', 0),
            'yellow':  raw.get('Luminance Adjustment Yellow', 0),
            'green':   raw.get('Luminance Adjustment Green', 0),
            'aqua':    raw.get('Luminance Adjustment Aqua', 0),
            'blue':    raw.get('Luminance Adjustment Blue', 0),
        },
    }
    
    import os
    base_name = filter_name or os.path.splitext(os.path.basename(dng_path))[0]
    filter_id = base_name.lower().replace(' ', '-')
    
    return {
        'id': filter_id,
        'name': base_name,
        'description': f'Filtro importado de {os.path.basename(dng_path)}',
        'params': params,
        'source': 'imported',
    }


# ── Carregar filtros customizados do disco ────────────────────────────────────

CUSTOM_FILTERS_PATH = Path(__file__).parent / 'custom_filters.json'

def load_all_filters() -> dict:
    """Retorna todos os filtros (built-in + customizados)."""
    all_filters = dict(FILTERS)
    if CUSTOM_FILTERS_PATH.exists():
        with open(CUSTOM_FILTERS_PATH) as f:
            custom = json.load(f)
            all_filters.update(custom)
    return all_filters

def save_custom_filter(filter_data: dict) -> None:
    """Salva um filtro customizado no disco."""
    custom = {}
    if CUSTOM_FILTERS_PATH.exists():
        with open(CUSTOM_FILTERS_PATH) as f:
            custom = json.load(f)
    custom[filter_data['id']] = filter_data
    with open(CUSTOM_FILTERS_PATH, 'w') as f:
        json.dump(custom, f, indent=2)
