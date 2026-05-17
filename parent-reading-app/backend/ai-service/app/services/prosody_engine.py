"""
情感韵律引擎 - 古诗吟诵模式

根据古诗的内容类型、情感属性和朗诵风格，自动生成韵律参数：
- 语速 (speed): 根据情感调整基础语速
- 停顿 (pause): 按照平仄和诗体规则插入停顿
- 音调 (pitch): 模拟吟诵的升降调
- 音量 (volume): 情感高潮处增强
- 温度 (temperature): 控制表现力强度

支持的朗诵风格：
- recite: 标准朗诵（清晰、规范）
- chant: 吟诵模式（传统腔调，拖音、平仄起伏）
- sing_song: 吟唱（接近歌唱式朗诵）
- story_tell: 讲述式（故事化朗诵，自然）
"""

from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ProsodyParams:
    """韵律参数"""
    speed: float = 1.0         # 语速 (0.5-2.0)
    temperature: float = 0.7   # 表现力 (0-1，高=更有表现力)
    top_p: float = 0.7         # 多样性
    pause_scale: float = 1.0   # 停顿倍率 (0.5-3.0)
    volume_db: float = 0.0     # 音量调整 (dB)
    normalize_loudness: bool = True


# ============================================================
# 情感→韵律参数映射
# ============================================================

EMOTION_PROSODY_MAP: Dict[str, ProsodyParams] = {
    # 平静 - 标准参数
    "neutral": ProsodyParams(
        speed=1.0, temperature=0.5, top_p=0.6,
        pause_scale=1.0, volume_db=0.0,
    ),
    # 温柔 - 稍慢、轻柔
    "gentle": ProsodyParams(
        speed=0.9, temperature=0.6, top_p=0.7,
        pause_scale=1.2, volume_db=-2.0,
    ),
    # 欢快 - 稍快、明亮
    "happy": ProsodyParams(
        speed=1.1, temperature=0.8, top_p=0.8,
        pause_scale=0.8, volume_db=1.0,
    ),
    # 哄睡 - 很慢、极轻柔
    "sleepy": ProsodyParams(
        speed=0.75, temperature=0.4, top_p=0.5,
        pause_scale=1.8, volume_db=-4.0,
    ),
    # 悲伤/思乡 - 慢、低沉
    "sad": ProsodyParams(
        speed=0.8, temperature=0.7, top_p=0.7,
        pause_scale=1.5, volume_db=-1.0,
    ),
    # 激昂/壮志 - 快、有力
    "excited": ProsodyParams(
        speed=1.15, temperature=0.9, top_p=0.85,
        pause_scale=0.7, volume_db=2.0,
    ),
    # 庄重/肃穆 - 慢、稳重
    "solemn": ProsodyParams(
        speed=0.85, temperature=0.6, top_p=0.6,
        pause_scale=1.4, volume_db=0.0,
    ),
    # 活泼/童趣 - 较快、跳跃感
    "playful": ProsodyParams(
        speed=1.1, temperature=0.85, top_p=0.85,
        pause_scale=0.9, volume_db=1.0,
    ),
}


# ============================================================
# 诗体→停顿规则
# ============================================================

# 五言诗：2+3 或 2+2+1 节奏
# 七言诗：2+2+3 或 4+3 节奏
POEM_PAUSE_RULES = {
    "五言绝句": {"句中": 200, "逗号": 400, "句号": 800, "联间": 1200},
    "七言绝句": {"句中": 150, "逗号": 350, "句号": 700, "联间": 1000},
    "五言律诗": {"句中": 200, "逗号": 400, "句号": 800, "联间": 1200},
    "七言律诗": {"句中": 150, "逗号": 350, "句号": 700, "联间": 1000},
    "五言古诗": {"句中": 250, "逗号": 500, "句号": 900, "联间": 1300},
    "七言古诗": {"句中": 200, "逗号": 450, "句号": 850, "联间": 1200},
    "五言乐府": {"句中": 200, "逗号": 400, "句号": 800, "联间": 1100},
    "七言乐府": {"句中": 180, "逗号": 400, "句号": 750, "联间": 1100},
}

# 默认停顿规则
DEFAULT_PAUSE_RULE = {"句中": 200, "逗号": 400, "句号": 800, "联间": 1000}


# ============================================================
# 朗诵风格修正系数
# ============================================================

STYLE_MODIFIERS = {
    "recite": {
        "speed_mult": 1.0,
        "pause_mult": 1.0,
        "temperature_add": 0.0,
        "description": "标准朗诵 - 清晰规范，适合教学",
    },
    "chant": {
        "speed_mult": 0.75,   # 吟诵需要更慢
        "pause_mult": 1.8,    # 更长停顿
        "temperature_add": 0.15,  # 更有表现力
        "description": "吟诵模式 - 传统腔调，拖音起伏",
    },
    "sing_song": {
        "speed_mult": 0.7,
        "pause_mult": 1.5,
        "temperature_add": 0.2,
        "description": "吟唱模式 - 接近歌唱，韵律感强",
    },
    "story_tell": {
        "speed_mult": 1.05,
        "pause_mult": 0.9,
        "temperature_add": 0.1,
        "description": "讲述式 - 自然流畅，适合故事",
    },
}


class ProsodyEngine:
    """
    情感韵律引擎

    根据内容属性生成最优韵律参数，传递给TTS引擎。
    """

    def compute_prosody(
        self,
        emotion: str = "gentle",
        poem_style: Optional[str] = None,
        poem_type: Optional[str] = None,
        speed_override: Optional[float] = None,
        pause_scale_override: Optional[float] = None,
    ) -> ProsodyParams:
        """
        计算最终韵律参数

        优先级：用户override > 风格修正 > 情感基础参数
        """
        # 1. 获取情感基础参数
        base = EMOTION_PROSODY_MAP.get(emotion, EMOTION_PROSODY_MAP["gentle"])
        params = ProsodyParams(
            speed=base.speed,
            temperature=base.temperature,
            top_p=base.top_p,
            pause_scale=base.pause_scale,
            volume_db=base.volume_db,
            normalize_loudness=base.normalize_loudness,
        )

        # 2. 应用朗诵风格修正
        if poem_style and poem_style in STYLE_MODIFIERS:
            modifier = STYLE_MODIFIERS[poem_style]
            params.speed *= modifier["speed_mult"]
            params.pause_scale *= modifier["pause_mult"]
            params.temperature = min(1.0, params.temperature + modifier["temperature_add"])

        # 3. 用户override覆盖
        if speed_override is not None:
            params.speed = speed_override
        if pause_scale_override is not None:
            params.pause_scale = pause_scale_override

        # 4. 边界裁剪
        params.speed = max(0.5, min(2.0, params.speed))
        params.temperature = max(0.1, min(1.0, params.temperature))
        params.pause_scale = max(0.3, min(3.0, params.pause_scale))

        return params

    def preprocess_poem_text(
        self,
        text: str,
        poem_type: Optional[str] = None,
        poem_style: Optional[str] = None,
        pause_scale: float = 1.0,
    ) -> str:
        """
        古诗文本韵律预处理

        根据诗体和风格，在合适的位置插入停顿标记。

        处理规则：
        1. 句号/问号/感叹号 → 长停顿（联间）
        2. 逗号 → 中停顿
        3. 五言2+3节奏 / 七言4+3节奏 → 短停顿（句中）
        """
        # 获取停顿规则
        rules = POEM_PAUSE_RULES.get(poem_type, DEFAULT_PAUSE_RULE)

        # 应用停顿倍率
        scaled_rules = {
            k: int(v * pause_scale) for k, v in rules.items()
        }

        # 处理标点停顿
        result = text

        # 句号 → 联间停顿
        for punct in ["。", "？", "！"]:
            pause_ms = scaled_rules["句号"]
            result = result.replace(punct, f"{punct}<break time='{pause_ms}ms'/>")

        # 逗号 → 句内停顿
        comma_pause = scaled_rules["逗号"]
        result = result.replace("，", f"，<break time='{comma_pause}ms'/>")

        # 吟诵模式：在句末增加拖音效果（通过额外停顿模拟）
        if poem_style == "chant":
            # 在每个句号前加一个短暂的"气口"
            for punct in ["。", "？", "！"]:
                result = result.replace(
                    f"{punct}<break",
                    f"~{punct}<break"  # ~ 作为拖音标记（TTS引擎会忽略但人工标记）
                )

        # 换行处理（多行诗之间）
        if "\n" in result:
            line_pause = scaled_rules.get("联间", 1000)
            result = result.replace("\n", f"\n<break time='{line_pause}ms'/>")

        return result

    def preprocess_story_text(
        self,
        text: str,
        emotion: str = "gentle",
        pause_scale: float = 1.0,
    ) -> str:
        """
        故事文本韵律预处理

        处理规则：
        - 对话部分(引号内)：稍微提升语气
        - 段落间：长停顿
        - 句号：中停顿
        - 省略号：渐弱停顿
        """
        result = text

        # 段落间
        para_pause = int(1200 * pause_scale)
        result = result.replace("\n\n", f"\n\n<break time='{para_pause}ms'/>")

        # 句号
        sentence_pause = int(500 * pause_scale)
        result = result.replace("。", f"。<break time='{sentence_pause}ms'/>")

        # 省略号 → 较长停顿
        ellipsis_pause = int(800 * pause_scale)
        result = result.replace("……", f"……<break time='{ellipsis_pause}ms'/>")
        result = result.replace("...", f"...<break time='{ellipsis_pause}ms'/>")

        # 感叹号
        excl_pause = int(600 * pause_scale)
        result = result.replace("！", f"！<break time='{excl_pause}ms'/>")

        # 问号
        quest_pause = int(600 * pause_scale)
        result = result.replace("？", f"？<break time='{quest_pause}ms'/>")

        return result

    def get_fish_audio_params(self, prosody: ProsodyParams) -> dict:
        """
        将韵律参数转换为 Fish Audio API 格式

        返回可直接用于 /v1/tts 请求体的参数。
        """
        return {
            "temperature": prosody.temperature,
            "top_p": prosody.top_p,
            "prosody": {
                "speed": prosody.speed,
                "volume": prosody.volume_db,
                "normalize_loudness": prosody.normalize_loudness,
            },
        }

    def detect_poem_emotion(self, title: str, content: str, author: str = "") -> str:
        """
        自动检测古诗情感（基于关键词匹配）

        用于没有人工标注emotion字段的诗歌。
        """
        text = f"{title} {content} {author}"

        # 悲伤/思乡类关键词
        sad_keywords = ["思", "愁", "泪", "悲", "离", "别", "孤", "寂", "恨", "怨",
                        "故乡", "相思", "断肠", "凄", "凉", "寒", "残", "暮", "落"]
        # 激昂/壮志类
        excited_keywords = ["壮", "雄", "豪", "志", "功", "战", "剑", "万里", "千里",
                           "英雄", "豪情", "长风", "破浪", "直上"]
        # 欢快/喜悦类
        happy_keywords = ["喜", "乐", "欢", "笑", "春", "花", "鸟", "歌", "翠",
                         "明", "暖", "新", "归", "逢"]
        # 活泼/童趣类
        playful_keywords = ["童", "儿", "小", "戏", "游", "蝶", "蜂", "蜻蜓",
                           "牧", "鹅", "鸭"]
        # 庄重/肃穆类
        solemn_keywords = ["国", "庙", "祭", "古", "帝", "皇", "社稷", "天下",
                          "苍生", "社", "庄"]

        # 计分
        scores = {
            "sad": sum(1 for kw in sad_keywords if kw in text),
            "excited": sum(1 for kw in excited_keywords if kw in text),
            "happy": sum(1 for kw in happy_keywords if kw in text),
            "playful": sum(1 for kw in playful_keywords if kw in text),
            "solemn": sum(1 for kw in solemn_keywords if kw in text),
        }

        # 选最高分
        max_emotion = max(scores, key=scores.get)
        if scores[max_emotion] >= 2:
            return max_emotion

        # 默认温柔
        return "gentle"

    def recommend_poem_style(self, poem_type: Optional[str] = None, emotion: str = "gentle") -> str:
        """
        推荐朗诵风格

        基于诗体类型和情感推荐最合适的朗诵风格。
        """
        # 绝句适合标准朗诵
        if poem_type in ("五言绝句", "七言绝句"):
            if emotion in ("sad", "solemn"):
                return "chant"
            return "recite"

        # 律诗适合吟诵
        if poem_type in ("五言律诗", "七言律诗"):
            return "chant"

        # 古诗（长篇）适合讲述
        if poem_type in ("五言古诗", "七言古诗"):
            if emotion == "excited":
                return "recite"
            return "story_tell"

        # 乐府适合吟唱
        if poem_type in ("五言乐府", "七言乐府"):
            return "sing_song"

        return "recite"


# 全局实例
prosody_engine = ProsodyEngine()
