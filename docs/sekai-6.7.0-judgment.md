# iOS 6.7.0：SUS 音符判定与预览色带

这是对本地 iOS 程序通过 IDA MCP 反编译、反汇编后的静态分析，配合本地 masterdata 快照。不是实机触摸回放结果。下面明确区分评分门限、输入门限和状态机；尤其不能把 trace 起点的状态截止时间当成保证可命中的最后触摸时间。

## 输入与可复核身份

- IPA：`/data/watagashi/sekai-v6.7.0-ios/6.7.0.ipa`。
- Mach-O：IPA 内 `Payload/ProductName.app/Frameworks/UnityFramework.framework/UnityFramework`，SHA-256 `a2ee14c6b3c69359bf3f5c231bcf871785cfc497c6d2d6deab77c60aca944d66`。
- metadata：同一 IPA 的 `Data/Managed/Metadata/global-metadata.dat`。用 Mach-O VA `0x5FB6920` 的 128 字节 key，逐字节 XOR `key[i & 127]` 后得到 v31 metadata；用本地 Il2CppDumper 重新生成方法地址映射。
- IDA MCP 使用现有的 `/data/xy/pjsk-670-ida-parallel/ios-clean/UnityFramework.i64`。配套 Mach-O 与本次提取的文件 SHA-256 一致；下列地址都是这份 **iOS** 程序的未重定位 VA。
- masterdata：`/data/watagashi/auto-leak/masterdata/ingameJudgeFrames.json`，SHA-256 `cdc7c48fd496e98dbf425ad685d87e99f0bfdd84918b2baa4bcc0fe40fabc925`。这是用户提供的当前本地数据，不声称是 IPA 发布当天的数据快照。

## 单位、端点、字段

用 `Δ = 输入时间 − 音符时间` 表示早晚，负数提前、正数延后。1f = 1/60 秒 ≈ 16.666667ms。保留 2.5f、3.3f 等小数，**不向整数帧取整**。

`MasterIngameJudgeFrame.OnAfterDeserialize` (`0x3DE56D0`) 将八个 `perfectBefore/perfectAfter/.../badAfter` 乘以 float32 常数 `0x3C888889`（1/60）。类定义和读取路径根本没有旧 `perfect/great/good/bad` 四个字段。因此表中普通 tap 的旧 `perfect=2`、旧 `great=5.5` 不应使用。

`LiveConfig.GetJudgeResultInternal` (`0x2CDFB30`) 按 JustPerfect → Perfect → Great → Good → Bad → Miss 的优先级返回第一个满足的区间。JustPerfect（±0.5f）与 Perfect 在这次显示中统一为紫色 Perfect。

评分函数对各档门限使用闭区间；`LiveUtility.IsJudgmentTiming` (`0x2A2C6E0`) 的输入门使用严格不等式：

```text
-badAfter / 60 < offset < badBefore / 60
```

所以外层输入边界不保证可判，内层分档的公共边界归更高等级。SVG 连续色带无法表现单个零宽端点的开闭差异；它保留原始门限，不给空区间硬加高度。未计入技能判定强化、音频/触摸偏移设置、轨道宽度容错、手指分配与邻接音符竞争。

## masterdata 全部 18 种类型

每格为“提前 / 延后”的**累计门限**，单位 f；Great 的独立区域是 Great 累计区间扣除 Perfect，其余类推。这里是原始评分配置，后续状态机章节解释哪些不能直接画成最终结果。

| ingameNoteType | Perfect | Great | Good | Bad |
| --- | --- | --- | --- | --- |
| normal | 2.5 / 2.5 | 5 / 5 | 6.5 / 6.5 | 7.5 / 7.5 |
| flick | 2.5 / 2.5 | 6.5 / 7.5 | 7 / 8 | 7.5 / 8.5 |
| long | 2.5 / 2.5 | 5 / 5 | 6.5 / 6.5 | 7.5 / 7.5 |
| long_end | 3.5 / 4 | 6.5 / 8 | 7.5 / 8.5 | 7.5 / 8.5 |
| long_end_flick | 3.5 / 4 | 6.5 / 8 | 7.5 / 8.5 | 7.5 / 8.5 |
| normal_critical | 3.3 / 3.3 | 4.5 / 4.5 | 6.5 / 6.5 | 7.5 / 7.5 |
| flick_critical | 3.5 / 3.5 | 6.5 / 7.5 | 7 / 8 | 7.5 / 8.5 |
| long_critical | 3.3 / 3.3 | 4.5 / 4.5 | 6.5 / 6.5 | 7.5 / 7.5 |
| long_end_critical | 3.5 / 4 | 6.5 / 8 | 7.5 / 8.5 | 7.5 / 8.5 |
| long_end_flick_critical | 3.5 / 4 | 6.5 / 8 | 7.5 / 8.5 | 7.5 / 8.5 |
| friction | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| friction_critical | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| friction_long | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| friction_long_end | 6.5 / 8 | 6.5 / 8 | 6.5 / 8 | 6.5 / 8 |
| friction_long_critical | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| friction_long_end_critical | 6.5 / 8 | 6.5 / 8 | 6.5 / 8 | 6.5 / 8 |
| friction_flick | 6.5 / 7.5 | 6.5 / 7.5 | 6.5 / 7.5 | 6.5 / 7.5 |
| friction_flick_critical | 6.5 / 7.5 | 6.5 / 7.5 | 6.5 / 7.5 | 6.5 / 7.5 |

表中 3.3 的存储值为 `3.299999952316284`；代码保留该值。表的 `id` 不等于 `JudgeFrameType` 枚举，尤其 friction 系列排序不同，不能按 id 直接索引枚举。

## 各类音符实际使用方式

### Tap、普通长条起点

- `NormalNote.Judgment` (`0x2CEDC70`) 分别调用普通判定或长条尾点判定。
- `LongNote.Judgment` (`0x2CECA78`) 第一次按下调用 `CalculateLongStartNoteResult` (`0x2CDFDA0`)。
- 普通与金色起点分别使用上表 `normal/long` 和 `normal_critical/long_critical`。四档均存在。
- 例：普通 tap Perfect ±41.667ms；Great 两侧 41.667–83.333ms；Good 83.333–108.333ms；Bad 108.333–125ms。
- `NoteBase.SetParentNote` (`0x2CEDABC`) 将金色状态从长条头继承到子音符。

### 普通滑键

`FlickNote.Judgment` (`0x2CE62FC`) 先记录按下的 touchId，再累积滑动；`JudgmentFlick` (`0x2CE5EE0`) 在滑动距离达标时才进行最终评分。独立滑键用 `CalculateFlickNoteResult` (`0x2CE00B0`)；不能把仅用于候选筛选的 `FlickNote.CalcNoteResult` (`0x2CE699C`，调用 long-start 判定) 当成最终评分。

早晚侧确实不同：普通滑键 Great 累计早 6.5f、晚 7.5f；Good 早 7f、晚 8f；Bad 早 7.5f、晚 8.5f。

方向错误时，`GetJudgeResultInternal(..., isDirection=false)` 绕过 JustPerfect/Perfect，在原 Perfect 范围返回 Great（WrongDirection）。因此颜色默认假定方向正确；错误方向没有额外、互斥的时间带。

### 普通长条尾点（松手）

`NormalNote.IsJudgment` (`0x2CEDB08`) 对长条尾点要求 Ended/Canceled；最终调用 `CalculateLongEndNoteResult` (`0x2CDFF28`)。

Perfect 早 3.5f、晚 4f；Great 早 6.5f、晚 8f；Good 早 7.5f、晚 8.5f。Bad 与 Good 完全重合，被前面的 Good 分支覆盖，**不存在独立 Bad 时间带**。普通和金色相同。

### 长条尾滑

`FlickNote.Judgment` 的 parentNote 分支先缓存滑动，在 `noteTime − touchTime <= −0.5f` 且方向正确、距离达标时才直接结算；`FlickNote.Excute` (`0x2CE5E14`) 也会在到点后、停止输入超过一帧时结算缓存。

因此早侧滑动不是按它发生的早侧时间直接给 Great/Good。可在 long_end_flick 的输入门限早侧 7.5f 内缓存，成功保持到结算时为 Perfect；早侧 3.5/6.5/7.5 的四档图会误导。预览将 −7.5f 到 0 画为**虚线 Perfect 预输入段**，实际结果仍依赖后续输入状态和结算时刻。晚侧使用 Perfect 4f、Great 8f、Good 8.5f；无独立 Bad。

### 独立 trace / friction

`FrictionNote.IsJudgment` (`0x2CE98DC`) 检查轨道和时间门；`Judgment` (`0x2CE99B8`) 提前输入只置 `isTouched=true`，到点后直接写 `JustPerfect=8`。`Excute` (`0x2CE9660`) 处理已记录触摸和超时。它根本没有用 Perfect/Great/Good 的数值分档，只由 Bad 门限决定能否接收触摸。

这份数据四档都为 5f，所以有效触摸门为 ±5f（±83.333ms），成功只会 Perfect，失败 Miss。提前部分是记忆输入，不能把触摸回调时刻等同于成绩结算时刻。金色相同。

### Trace 长条起点

不能仅由 `friction_long` 的 ±5f 推断最终窗口。

- `FrictionLongNote.IsJudgment` (`0x2CE8FEC`) 的 offset 来自 `CalcExcuteNoteLane` (`0x2A2E4E4`)：
  `min(now − headTime, max(now − endTime, 0))`。
- 头之前 offset 为 `now − headTime`，所以早侧接收门为 5f。
- 头到尾之间 offset 被钳到 **0**，所以表中的 after=5f 并不限制迟触起点。
- `Judgment` (`0x2CE9180`) 只记 `isTouched`；`Excute` (`0x2CE89F4`) 到点后写 JustPerfect，但首先检查 `now − headTime > LiveConfig.JudgeTime`。
- `LiveConfig..cctor` (`0x2CE0718`) 中 `JudgeTime=0.125s=7.5f`。超过此线则进入 Miss 状态，先前触摸尚未在更新中兑现也不能获得起点 Perfect。

预览以虚线标出早 5f 的预输入及晚侧到 7.5f 的**状态截止范围**。它不是“触摸在 +7.5f 前都一定成功”：首次触摸后的下一次更新仍须未过截止，短条还受尾部和链状态限制。按相邻 60Hz 更新推演，输入与下一次更新的相位会改变可用的最后采样点。本实现没有把一个固定的最晚触摸数值冒充实机测量结果。

### Trace 长条尾点

`FrictionNote.SetParentNote` (`0x2CE95EC`) 将其类别改为 FrictionLong；`GetINoteToJudgeFrameType` (`0x2A2BF48`) 因 parentNote 选择 friction_long_end。

这里存在容易漏掉的**符号差异**：

- 普通 tap/flick 的输入门传 `noteTime − touchTime`。
- `FrictionNote.Excute` 存的是 `currentFrameTime − noteTime`，`IsJudgment` 原样传入这个 offset。
- 共用门仍为 `−badAfter < offset < badBefore`（已对 `0x2A2C748` 的 LDP/FNEG/FCMP/FCCMP 反汇编核对）。

因此相对实际时间的门是 **早 8f、晚 6.5f**，不是字段名字看起来的早 6.5f、晚 8f。提前触摸记忆到点后兑现，成功直接 Perfect。长条外层检查还可能进一步限制短链/异常链。金色相同。

### Trace 滑键与 trace 尾滑

- `FrictionFlickNote.JudgmentFlick` (`0x2CE6D34`) 最终调用 `CalculateFrictionFlickNoteResult` (`0x2CE03C8`)。
- 独立 trace 滑键输入门早 6.5f、晚 7.5f；提前动作缓存到正拍结算 (`Judgment` `0x2CE70E8` / `Excute` `0x2CE6C48`)。
- 正确方向时四档阈值重合，所以只有 Perfect/Miss；**错向仍能得到 Great**。Good/Bad 没有独立时间范围。
- trace 尾滑仍是 FrictionFlickNote，SUS `ConvertFrictionFlickNote` (`0x2BDB734`) 在 LongJoinCheck 后保留此类。但 `GetINoteToJudgeFrameType` 对 parentNote 返回 long_end_flick，所以**输入门**改成早 7.5f、晚 8.5f；最终评分仍是 friction_flick（晚 7.5f 截止）。
- 因此预览用早 7.5f 的缓存段和晚 7.5f 的 Perfect 段。输入门允许、但评分已为 Miss 的晚 7.5–8.5f 不显示。
- `FrictionFlickNote.CalcNoteResult` (`0x2CE76E8`) 同样只是候选筛选用的 long-start 判定，不是最终成绩。

### 中继点、自动 combo、隐藏/装饰节点

- `ConnectionNote.Excute/IsJudgment/Judgment` (`0x2CE558C` / `0x2CE5828` / `0x2CE58B8`) 到点检查状态，触摸补判时也直接写 JustPerfect。没有 masterdata 四档时间窗。
- `LongHoldCombo.Excute/IsJudgment` (`0x2CEAE18` / `0x2CEB05C`) 也是到点持有检查。无触摸会经过 Pass 状态再 Miss；不能虚构 ±5f 的自动 combo 时间窗。
- 可见 SUS 中继点用紫色细虚线表示检查时刻，**线宽不是判定容错**。渲染模型原本不包含的自动 combo 点不额外生成。
- 不计分的隐藏头/尾（CANCEL）、隐藏路径点、guide/装饰链不画判定色带。

## 预览实现与使用

- 只在官谱预览启用交互。提示“点击音符查看判定，可多选，再点关闭。”放在原有标题栏内，保持单行，没有全局开关或图例栏。
- 可以同时选择多个音符；每个音符独立开关，关闭一个不影响其他选中项。顶部“取消全部判定”一次清空。支持鼠标、触屏及 Enter/空格。
- 谱面主体作为静态 SVG 图片显示；独立的轻量 SVG 覆盖层只包含点击区域与选中的判定。点击不再修改完整谱面 SVG，避免连带重绘大量音符、长条和文字。判定数据按类型共用；时间预先计算，按栏二分查找可见音符。
- 初次不生成色带，点击时按需创建；取消全部只遍历已选中的项目。PNG 导出时才将选中的判定合成回原谱面。
- 紫 / 黄 / 绿 / 蓝对应 Perfect / Great / Good / Bad，不生成 Miss。虚线表示预输入或状态条件；中继点细线只表示检查时刻。
- 按真实秒数换算高度，晚侧在音符上方、早侧在下方；BPM、拍号与 rebase 不改变判定时长。
- SUS / JSON 转图片和自制谱保持原来的纯 SVG 流程，不包含判定交互数据或脚本。官谱 PNG 下载保留当前显示的判定。

主要实现：`src/vendor/sekai-sus2img/judgmentTiming.ts`、`renderer.ts`、`src/utils/noteJudgmentInteraction.ts`。

验证：`node --test tests/judgmentTiming.test.mjs` 覆盖判定分档、特殊状态、JSON/rebase、按需渲染及纯 SVG 输出；浏览器检查点击开关、切换音符、缩放、键盘操作和密集谱面的 DOM 变化。构建验证使用 `npm run build`。
