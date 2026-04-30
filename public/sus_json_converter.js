/*
 * SUS <-> Project SEKAI score JSON converter.
 *
 * Browser:
 *   const json = SekaiSusJsonConverter.susToJson(susText, { musicId: 662 });
 *   const sus = SekaiSusJsonConverter.jsonToSus(json);
 *
 * Node:
 *   const { susToJson, jsonToSus } = require("./sus_json_converter.js");
 *   node sus_json_converter.js sus2json input.sus output.json
 *   node sus_json_converter.js json2sus input.json output.sus
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SekaiSusJsonConverter = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_TICKS_PER_BEAT = 480;
  const DEFAULT_BEATS_PER_MEASURE = 4;

  const NoteKind = {
    TAP: "tap",
    SLIDE: "slide",
    DIRECTIONAL: "directional",
  };

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b || 1);
  }

  function fromBase36(value) {
    return parseInt(value, 36);
  }

  function toBase36(value, width = 1) {
    const text = Math.trunc(value).toString(36);
    return text.padStart(width, "0").slice(-width);
  }

  function formatNumber(value) {
    if (typeof value === "string") return value;
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(8)));
  }

  function parseSusMetaValue(value) {
    const trimmed = value.trim();
    if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"');
    }
    return trimmed;
  }

  function timeSignatureToTicks(value, ticksPerBeat) {
    const match = String(value).match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (!match) return DEFAULT_BEATS_PER_MEASURE * ticksPerBeat;
    return Math.round((Number(match[1]) * ticksPerBeat * 4) / Number(match[2]));
  }

  function ticksToTimeSignature(ticks, ticksPerBeat) {
    for (const denominator of [4, 8, 16, 32, 64]) {
      const numerator = (ticks * denominator) / (ticksPerBeat * 4);
      if (Number.isInteger(numerator) && numerator > 0) {
        return `${numerator}/${denominator}`;
      }
    }

    const wholeTicks = ticksPerBeat * 4;
    const divisor = gcd(ticks, wholeTicks);
    return `${ticks / divisor}/${wholeTicks / divisor}`;
  }

  function standardMeasureLengths(ticksPerBeat, maxTicks) {
    const lengths = new Set();
    const wholeTicks = ticksPerBeat * 4;
    for (const denominator of [4, 8, 16, 32, 64]) {
      for (let numerator = 1; numerator <= denominator; numerator += 1) {
        const ticks = (numerator * wholeTicks) / denominator;
        if (Number.isInteger(ticks) && ticks > 0 && ticks <= maxTicks) {
          lengths.add(ticks);
        }
      }
    }
    return [...lengths].sort((a, b) => b - a);
  }

  function chooseMeasureLengthAfterBpm(currentTick, futureBpmTicks, currentTicks, defaultTicks, ticksPerBeat) {
    if (!futureBpmTicks.length) return defaultTicks;

    const candidates = standardMeasureLengths(ticksPerBeat, defaultTicks);
    const nextGap = futureBpmTicks[0] - currentTick;
    if (currentTicks < defaultTicks / 2 && nextGap >= defaultTicks && nextGap % defaultTicks === 0) {
      return defaultTicks;
    }
    if (nextGap > 0 && nextGap < defaultTicks && !candidates.includes(nextGap)) {
      candidates.push(nextGap);
    }

    let best = defaultTicks;
    let bestScore = -1;
    let bestAlignedCount = 0;
    let currentAlignedCount = 0;
    for (const length of candidates) {
      if (length <= 0) continue;

      let alignedCount = 0;
      for (const tick of futureBpmTicks) {
        if ((tick - currentTick) % length !== 0) break;
        alignedCount += 1;
      }
      const score = alignedCount * length;
      if (length === currentTicks) currentAlignedCount = alignedCount;

      if (
        score > bestScore ||
        (score === bestScore && length === currentTicks) ||
        (score === bestScore && best !== currentTicks && length === defaultTicks) ||
        (score === bestScore && best !== currentTicks && best !== defaultTicks && length > best)
      ) {
        best = length;
        bestScore = score;
        bestAlignedCount = alignedCount;
      }
    }

    if (currentAlignedCount > 0 && bestAlignedCount <= currentAlignedCount + 1) {
      return currentTicks;
    }

    return bestScore > 0 ? best : gcd(nextGap, defaultTicks);
  }

  function synthesizeBpmMeasureEvents(events, ticksPerBeat) {
    const defaultTicks = ticksPerBeat * DEFAULT_BEATS_PER_MEASURE;
    const bpmTicks = [
      ...new Set(
        events
          .filter((event) => event.eventType === 0)
          .map((event) => Math.round(event.ticks))
      ),
    ].sort((a, b) => a - b);
    if (bpmTicks.length <= 1) return [];

    const measureLengths = new Map();
    for (const event of events) {
      if (event.eventType === 3) {
        measureLengths.set(Math.round(event.ticks), timeSignatureToTicks(event.changeValue, ticksPerBeat));
      }
    }
    if (!measureLengths.has(0)) measureLengths.set(0, defaultTicks);

    const synthetic = [];
    const addMeasure = (tick, length) => {
      tick = Math.round(tick);
      length = Math.round(length);
      if (measureLengths.has(tick)) return false;
      measureLengths.set(tick, length);
      synthetic.push({
        eventType: 3,
        ticks: tick,
        changeValue: ticksToTimeSignature(length, ticksPerBeat),
      });
      return true;
    };

    let boundary = 0;
    let currentLength = measureLengths.get(0);

    for (let i = 1; i < bpmTicks.length; i += 1) {
      const bpmTick = bpmTicks[i];

      while (boundary + currentLength <= bpmTick) {
        boundary += currentLength;
        if (measureLengths.has(boundary)) {
          currentLength = measureLengths.get(boundary);
        }
      }

      if (boundary < bpmTick) {
        const splitLength = bpmTick - boundary;
        addMeasure(boundary, splitLength);
        currentLength = measureLengths.get(boundary);
        boundary = bpmTick;
      }

      const nextLength = chooseMeasureLengthAfterBpm(
        bpmTick,
        bpmTicks.slice(i + 1),
        currentLength,
        defaultTicks,
        ticksPerBeat
      );

      if (measureLengths.has(bpmTick)) {
        currentLength = measureLengths.get(bpmTick);
      } else if (nextLength !== currentLength) {
        addMeasure(bpmTick, nextLength);
        currentLength = nextLength;
      }
    }

    return synthetic;
  }

  function quoteSus(value) {
    return `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }

  function tickToBarTick(ticks, ticksPerMeasure) {
    const rounded = Math.round(ticks);
    return {
      bar: Math.floor(rounded / ticksPerMeasure),
      tick: ((rounded % ticksPerMeasure) + ticksPerMeasure) % ticksPerMeasure,
    };
  }

  function createMeasureMap(pending, ticksPerBeat) {
    const changes = new Map([[0, DEFAULT_BEATS_PER_MEASURE]]);
    let maxBar = 0;

    for (const { header, data } of pending) {
      const barMatch = header.match(/^(\d\d\d)/);
      if (barMatch) maxBar = Math.max(maxBar, Number(barMatch[1]));
      const lengthMatch = header.match(/^(\d\d\d)02$/);
      if (lengthMatch) changes.set(Number(lengthMatch[1]), Number(data));
    }

    const starts = [0];
    const lengths = [];
    let currentBeats = DEFAULT_BEATS_PER_MEASURE;
    for (let bar = 0; bar <= maxBar + 2; bar += 1) {
      if (changes.has(bar)) currentBeats = changes.get(bar);
      lengths[bar] = currentBeats * ticksPerBeat;
      starts[bar + 1] = starts[bar] + lengths[bar];
    }

    return {
      start(bar) {
        while (bar >= starts.length) {
          const lastLength = lengths[lengths.length - 1] || DEFAULT_BEATS_PER_MEASURE * ticksPerBeat;
          lengths.push(lastLength);
          starts.push(starts[starts.length - 1] + lastLength);
        }
        return starts[bar];
      },
      length(bar) {
        this.start(bar);
        return lengths[bar];
      },
    };
  }

  function parseScoreData(data, ticksPerMeasure) {
    const items = [];
    const slots = Math.floor(data.length / 2);
    for (let i = 0; i < slots; i += 1) {
      const code = data.slice(i * 2, i * 2 + 2);
      if (code !== "00") {
        items.push({
          tick: Math.round((i * ticksPerMeasure) / slots),
          code,
        });
      }
    }
    return items;
  }

  function parseSus(susText) {
    let ticksPerBeat = DEFAULT_TICKS_PER_BEAT;
    const meta = {};
    const events = [];
    const notes = [];
    const bpmDefinitions = new Map();
    const speedDefinitions = new Map();

    const lines = String(susText).replace(/\r\n?/g, "\n").split("\n");
    const pending = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("#")) continue;

      let match = line.match(/^#(\w+)\s+(.*)$/);
      if (match) {
        const header = match[1];
        const data = match[2];
        if (header === "REQUEST") {
          const req = data.match(/^"ticks_per_beat\s+(\d+)"$/);
          if (req) ticksPerBeat = Number(req[1]);
        } else {
          meta[header.toLowerCase()] = parseSusMetaValue(data);
        }
        continue;
      }

      match = line.match(/^#(\w+):\s*(.*)$/);
      if (!match) continue;
      pending.push({ header: match[1], data: match[2] });
    }

    const ticksPerMeasure = ticksPerBeat * DEFAULT_BEATS_PER_MEASURE;
    const measureMap = createMeasureMap(pending, ticksPerBeat);

    for (const { header, data } of pending) {
      let match = header.match(/^BPM(..)$/);
      if (match) {
        bpmDefinitions.set(fromBase36(match[1]), Number(data));
        continue;
      }

      match = header.match(/^TIL(..)$/);
      if (match) {
        const id = fromBase36(match[1]);
        const items = [];
        const body = parseSusMetaValue(data);
        if (body) {
          for (const item of body.split(",")) {
            const part = item.trim().match(/^(\d+)'(\d+):(\S+)$/);
            if (part) {
              items.push({
                bar: Number(part[1]),
                tick: Number(part[2]),
                speed: Number(part[3]),
              });
            }
          }
        }
        speedDefinitions.set(id, items);
        continue;
      }

      match = header.match(/^(\d\d\d)02$/);
      if (match) {
        const beats = Number(data);
        events.push({
          eventType: 3,
          ticks: measureMap.start(Number(match[1])),
          changeValue: `${beats}/4`,
        });
        continue;
      }

      match = header.match(/^(\d\d\d)08$/);
      if (match) {
        const bar = Number(match[1]);
        const measureTicks = measureMap.length(bar);
        for (const item of parseScoreData(data, measureTicks)) {
          const bpm = bpmDefinitions.get(fromBase36(item.code));
          if (bpm != null) {
            events.push({
              eventType: 0,
              ticks: measureMap.start(bar) + item.tick,
              changeValue: bpm,
            });
          }
        }
        continue;
      }

      match = header.match(/^(\d\d\d)1(.)$/);
      if (match) {
        const bar = Number(match[1]);
        const lane = fromBase36(match[2]);
        const measureTicks = measureMap.length(bar);
        for (const item of parseScoreData(data, measureTicks)) {
          notes.push({
            kind: NoteKind.TAP,
            ticks: measureMap.start(bar) + item.tick,
            lane,
            width: fromBase36(item.code[1]),
            type: fromBase36(item.code[0]),
          });
        }
        continue;
      }

      match = header.match(/^(\d\d\d)3(.)(.)$/);
      if (match) {
        const bar = Number(match[1]);
        const lane = fromBase36(match[2]);
        const channel = fromBase36(match[3]);
        const measureTicks = measureMap.length(bar);
        for (const item of parseScoreData(data, measureTicks)) {
          notes.push({
            kind: NoteKind.SLIDE,
            ticks: measureMap.start(bar) + item.tick,
            lane,
            width: fromBase36(item.code[1]),
            type: fromBase36(item.code[0]),
            channel,
            decoration: false,
          });
        }
        continue;
      }

      match = header.match(/^(\d\d\d)5(.)$/);
      if (match) {
        const bar = Number(match[1]);
        const lane = fromBase36(match[2]);
        const measureTicks = measureMap.length(bar);
        for (const item of parseScoreData(data, measureTicks)) {
          notes.push({
            kind: NoteKind.DIRECTIONAL,
            ticks: measureMap.start(bar) + item.tick,
            lane,
            width: fromBase36(item.code[1]),
            type: fromBase36(item.code[0]),
          });
        }
        continue;
      }

      match = header.match(/^(\d\d\d)9(.)(.)$/);
      if (match) {
        const bar = Number(match[1]);
        const lane = fromBase36(match[2]);
        const channel = fromBase36(match[3]);
        const measureTicks = measureMap.length(bar);
        for (const item of parseScoreData(data, measureTicks)) {
          notes.push({
            kind: NoteKind.SLIDE,
            ticks: measureMap.start(bar) + item.tick,
            lane,
            width: fromBase36(item.code[1]),
            type: fromBase36(item.code[0]),
            channel,
            decoration: true,
          });
        }
      }
    }

    events.push(...synthesizeBpmMeasureEvents(events, ticksPerBeat));

    return {
      meta,
      ticksPerBeat,
      ticksPerMeasure,
      bpmDefinitions,
      speedDefinitions,
      events,
      notes,
    };
  }

  function noteKey(note) {
    return `${note.ticks}:${note.lane}:${note.width}`;
  }

  function sortRawNotes(a, b) {
    return (
      a.ticks - b.ticks ||
      a.lane - b.lane ||
      a.width - b.width ||
      (a.kind > b.kind ? 1 : a.kind < b.kind ? -1 : 0)
    );
  }

  function mergeSusNotes(rawNotes) {
    const notes = rawNotes
      .filter((note) => note.lane >= 2 && note.lane <= 13)
      .map((note, index) => ({ ...note, _rawIndex: index, _deleted: false }))
      .sort(sortRawNotes);

    const byPosition = new Map();
    for (const note of notes) {
      const key = noteKey(note);
      if (!byPosition.has(key)) byPosition.set(key, []);
      byPosition.get(key).push(note);
    }

    for (const directional of notes) {
      if (directional._deleted || directional.kind !== NoteKind.DIRECTIONAL) continue;
      const peers = byPosition.get(noteKey(directional)) || [];
      if (peers.some((item) => !item._deleted && item.kind === NoteKind.SLIDE)) continue;
      const taps = byPosition.get(noteKey(directional)) || [];
      const tap = taps.find((item) => !item._deleted && item.kind === NoteKind.TAP);
      if (tap) {
        tap._deleted = true;
        directional.tap = tap;
      }
    }

    for (const slide of notes) {
      if (slide._deleted || slide.kind !== NoteKind.SLIDE || slide.decoration) continue;
      const peers = byPosition.get(noteKey(slide)) || [];
      const tap = peers.find((item) => !item._deleted && item.kind === NoteKind.TAP);
      if (tap) {
        tap._deleted = true;
        if (!(slide.type === 3 && tap.type === 3)) slide.tap = tap;
      }
    }

    for (const slide of notes) {
      if (slide._deleted || slide.kind !== NoteKind.SLIDE || !slide.decoration) continue;
      const peers = byPosition.get(noteKey(slide)) || [];
      const tap = peers.find((item) => !item._deleted && item.kind === NoteKind.TAP);
      if (tap) slide.criticalTap = tap;
    }

    for (const slide of notes) {
      if (slide._deleted || slide.kind !== NoteKind.SLIDE) continue;
      const peers = byPosition.get(noteKey(slide)) || [];
      const hasDecorationSlide = peers.some(
        (item) => !item._deleted && item.kind === NoteKind.SLIDE && item.decoration
      );
      if (!slide.decoration && hasDecorationSlide) continue;
      const directional = peers.find(
        (item) => !item._deleted && item.kind === NoteKind.DIRECTIONAL
      );
      if (directional) {
        directional._deleted = true;
        slide.directional = directional;
        if (directional.tap) slide.tap = directional.tap;
      }
    }

    const slideGroups = new Map();
    for (const slide of notes) {
      if (slide._deleted || slide.kind !== NoteKind.SLIDE) continue;
      const key = `${slide.decoration ? 1 : 0}:${slide.channel}`;
      if (!slideGroups.has(key)) slideGroups.set(key, []);
      slideGroups.get(key).push(slide);
    }
    for (const group of slideGroups.values()) {
      group.sort(sortRawNotes);
      for (let i = 0; i < group.length - 1; i += 1) {
        if (group[i].type !== 2) {
          group[i].next = group[i + 1];
          group[i + 1].previous = group[i];
        }
      }
    }

    const merged = notes.filter((note) => !note._deleted).sort(sortRawNotes);
    for (const note of merged) delete note._deleted;
    return merged;
  }

  function tapCritical(type) {
    return type === 2 || type === 6 || type === 8;
  }

  function noteCritical(note) {
    if (!note) return false;
    if (note.kind === NoteKind.TAP) return tapCritical(note.type);
    if (note.tap && tapCritical(note.tap.type)) return true;
    if (note.criticalTap && tapCritical(note.criticalTap.type)) return true;
    if (note.directional && noteCritical(note.directional)) return true;
    return false;
  }

  function chainCritical(slide) {
    let head = slide;
    while (head.previous) head = head.previous;
    for (let item = head; item; item = item.next) {
      if (noteCritical(item)) return true;
      if (item.type === 2) break;
    }
    return false;
  }

  function flickDirectionFromDirectional(type) {
    if (type === 3 || type === 5) return 1;
    if (type === 4 || type === 6) return 2;
    return 0;
  }

  function lineTypeFromDirectional(type) {
    if (type === 5 || type === 6) return 1;
    if (type === 2 || type === 3 || type === 4) return 2;
    return 0;
  }

  function connectedFlags(note) {
    return {
      IsSingle: note.previousConnectionId === -1 && note.nextConnectionId === -1,
      IsConnectedFirst:
        note.previousConnectionId === -1 && note.nextConnectionId !== -1,
      IsConnectedLast:
        note.previousConnectionId !== -1 && note.nextConnectionId === -1,
    };
  }

  function rawNoteToJsonBase(note) {
    const laneStart = note.lane - 2;
    return {
      ticks: Math.round(note.ticks),
      laneStart,
      laneEnd: laneStart + note.width - 1,
      speedRatio: 1.0,
      noteLineType: 0,
      previousConnectionId: -1,
      nextConnectionId: -1,
      direction: 0,
      isSkip: false,
    };
  }

  function classifyTap(note) {
    const out = rawNoteToJsonBase(note);
    if (note.type === 1 || note.type === 2) {
      return { ...out, category: 0, type: note.type === 2 ? 1 : 0, noteBaseType: 1 };
    }
    if (note.type === 3) {
      return { ...out, category: 3, type: 0, noteBaseType: 3 };
    }
    if (note.type === 5 || note.type === 6) {
      return { ...out, category: 4, type: note.type === 6 ? 1 : 0, noteBaseType: 11 };
    }
    if (note.type === 7 || note.type === 8) {
      return { ...out, category: 7, type: note.type === 8 ? 1 : 0, noteBaseType: 9 };
    }
    return null;
  }

  function classifyDirectional(note) {
    const out = rawNoteToJsonBase(note);
    if (note.tap && note.tap.type === 6) {
      return {
        ...out,
        category: 8,
        type: 1,
        noteBaseType: 4,
        direction: 0,
      };
    }
    return {
      ...out,
      category: 3,
      type: noteCritical(note) ? 1 : 0,
      noteBaseType: 3,
      direction: flickDirectionFromDirectional(note.type),
    };
  }

  function classifySlide(note) {
    const out = rawNoteToJsonBase(note);
    const critical = chainCritical(note) ? 1 : 0;
    const tapType = note.tap ? note.tap.type : 0;
    const lineType = note.directional ? lineTypeFromDirectional(note.directional.type) : 0;

    out.noteLineType = lineType;

    if (note.decoration) {
      if (note.type === 1) {
        return { ...out, category: 9, type: critical, noteBaseType: 10 };
      }
      return { ...out, category: 9, type: critical, noteBaseType: 13 };
    }

    if (note.type === 1) {
      if (tapType === 7 || tapType === 8) {
        return { ...out, category: 7, type: tapType === 8 ? 1 : critical, noteBaseType: 9 };
      }
      if (tapType === 5 || tapType === 6) {
        return { ...out, category: 6, type: tapType === 6 ? 1 : critical, noteBaseType: 8 };
      }
      return { ...out, category: 1, type: critical, noteBaseType: 2 };
    }

    if (note.type === 2) {
      if (note.directional) {
        return {
          ...out,
          category: 3,
          type: critical,
          noteBaseType: 3,
          noteLineType: 0,
          direction: flickDirectionFromDirectional(note.directional.type),
        };
      }
      if (tapType === 7 || tapType === 8) {
        return { ...out, category: 5, type: tapType === 8 ? 1 : critical, noteBaseType: 12 };
      }
      if (tapType === 5 || tapType === 6) {
        return { ...out, category: 4, type: tapType === 6 ? 1 : critical, noteBaseType: 11 };
      }
      return { ...out, category: 1, type: critical, noteBaseType: 1 };
    }

    if (note.type === 3) {
      return {
        ...out,
        category: 2,
        type: critical,
        noteBaseType: 5,
        isSkip: false,
      };
    }

    if (note.type === 5) {
      return { ...out, category: 13, type: critical, noteBaseType: 6 };
    }

    return null;
  }

  function createDefaultEvents(parsed, options) {
    const eventItems = [];
    const measureTemplate = Array.isArray(options.measureEvents)
      ? options.measureEvents.map((event) => ({
          eventType: 3,
          ticks: Math.round(Number(event.ticks)),
          changeValue: String(event.changeValue),
          _orderAfterBpm: Boolean(event.afterBpm || event.orderAfterBpm),
        }))
      : null;
    const parsedEvents = measureTemplate
      ? parsed.events.filter((event) => event.eventType !== 3)
      : parsed.events;

    if (!parsedEvents.some((event) => event.eventType === 1 && event.ticks === 0)) {
      eventItems.push({ eventType: 1, ticks: 0, changeValue: 1.0 });
    }
    if (
      !measureTemplate &&
      !parsedEvents.some((event) => event.eventType === 3 && event.ticks === 0)
    ) {
      eventItems.push({ eventType: 3, ticks: 0, changeValue: "4/4" });
    }
    if (!parsedEvents.some((event) => event.eventType === 0 && event.ticks === 0)) {
      eventItems.push({
        eventType: 0,
        ticks: 0,
        changeValue: Number(options.defaultBpm ?? 120),
      });
    }
    if (!parsedEvents.some((event) => event.eventType === 2 && event.ticks === 0)) {
      eventItems.push({ eventType: 2, ticks: 0, changeValue: 1.0 });
    }

    eventItems.push(...parsedEvents);
    if (measureTemplate) eventItems.push(...measureTemplate);
    return eventItems
      .filter(
        (event, index, self) =>
          self.findIndex(
            (item) =>
              item.eventType === event.eventType &&
              item.ticks === event.ticks &&
              String(item.changeValue) === String(event.changeValue)
          ) === index
      )
      .sort((a, b) => {
        const eventTypeOrder = (event) => {
          if (event.eventType === 1) return 0;
          if (event.eventType === 3) return event._orderAfterBpm ? 2.5 : 1;
          if (event.eventType === 0) return 2;
          if (event.eventType === 2) return 3;
          return 99;
        };
        return (
          a.ticks - b.ticks ||
          eventTypeOrder(a) - eventTypeOrder(b) ||
          String(a.changeValue).localeCompare(String(b.changeValue))
        );
      });
  }

  function assignOfficialLikeIds(noteItems, eventItems, options) {
    const bpmEvents = eventItems.filter((event) => event.eventType === 0);
    const speedEvents = eventItems.filter((event) => event.eventType === 2);
    let nextBpmId = 5;
    let maxPreNoteId = 4;

    for (let i = 0; i < bpmEvents.length; i += 1) {
      bpmEvents[i].id = i === 0 ? 1 : nextBpmId;
      if (i !== 0) nextBpmId += 1;
      maxPreNoteId = Math.max(maxPreNoteId, bpmEvents[i].id);
    }

    for (let i = 0; i < speedEvents.length; i += 1) {
      speedEvents[i].id = i === 0 ? 4 : maxPreNoteId + 1;
      maxPreNoteId = Math.max(maxPreNoteId, speedEvents[i].id);
    }

    const startNoteId = Number(options.startNoteId ?? maxPreNoteId + 1);
    for (let i = 0; i < noteItems.length; i += 1) {
      noteItems[i].id = startNoteId + i;
    }

    let nextPostNoteId = startNoteId + noteItems.length;
    for (const eventType of [3, 1]) {
      for (const event of eventItems) {
        if (event.eventType === eventType) {
          event.id = nextPostNoteId;
          nextPostNoteId += 1;
        }
      }
    }

    for (const event of eventItems) {
      if (event.id == null) {
        event.id = nextPostNoteId;
        nextPostNoteId += 1;
      }
    }

    for (let i = 0; i < eventItems.length; i += 1) {
      eventItems[i].$id = String(i + 2);
      delete eventItems[i]._orderAfterBpm;
    }
  }

  function susToJson(susText, options = {}) {
    const parsed = parseSus(susText);
    const merged = mergeSusNotes(parsed.notes);
    const noteItems = [];
    const rawToJson = new Map();

    for (const note of merged) {
      let item = null;
      if (note.kind === NoteKind.TAP) item = classifyTap(note);
      else if (note.kind === NoteKind.DIRECTIONAL) item = classifyDirectional(note);
      else if (note.kind === NoteKind.SLIDE) item = classifySlide(note);
      if (item) {
        rawToJson.set(note, item);
        noteItems.push(item);
      }
    }

    noteItems.sort(
      (a, b) =>
        a.ticks - b.ticks ||
        a.laneStart - b.laneStart ||
        a.laneEnd - b.laneEnd ||
        a.category - b.category ||
        a.noteBaseType - b.noteBaseType
    );

    const eventItems = createDefaultEvents(parsed, options);
    assignOfficialLikeIds(noteItems, eventItems, options);

    for (const note of merged) {
      const item = rawToJson.get(note);
      if (!item) continue;
      const previous = note.previous ? rawToJson.get(note.previous) : null;
      const next = note.next ? rawToJson.get(note.next) : null;
      item.previousConnectionId = previous ? previous.id : -1;
      item.nextConnectionId = next ? next.id : -1;
    }

    for (const item of noteItems) {
      Object.assign(item, connectedFlags(item));
    }

    const sortedNotes = noteItems.map((item, index) => ({
      $id: String(eventItems.length + 2 + index),
      id: item.id,
      ticks: item.ticks,
      laneStart: item.laneStart,
      laneEnd: item.laneEnd,
      category: item.category,
      type: item.type,
      speedRatio: item.speedRatio,
      noteLineType: item.noteLineType,
      noteBaseType: item.noteBaseType,
      previousConnectionId: item.previousConnectionId,
      nextConnectionId: item.nextConnectionId,
      direction: item.direction,
      isSkip: item.isSkip,
      IsSingle: item.IsSingle,
      IsConnectedFirst: item.IsConnectedFirst,
      IsConnectedLast: item.IsConnectedLast,
    }));

    const maxTick = sortedNotes.reduce((max, note) => Math.max(max, note.ticks), 0);
    return {
      $id: "1",
      MusicId: Number(options.musicId ?? parsed.meta.songid ?? 0),
      EventArray: [],
      FullComboDataHash: options.fullComboDataHash ?? null,
      MusicScoreEventDataList: eventItems,
      MusicScoreTicksMax: Number(options.musicScoreTicksMax ?? maxTick),
      NoteList: sortedNotes,
      VersionCode: Number(options.versionCode ?? 10000),
    };
  }

  function addSusObject(groups, ticksPerMeasure, tick, header, code) {
    const { bar, tick: tickInMeasure } = tickToBarTick(tick, ticksPerMeasure);
    const key = `${bar}:${header}`;
    if (!groups.has(key)) groups.set(key, { bar, header, items: [] });
    groups.get(key).items.push({ tick: tickInMeasure, code });
  }

  function buildSusData(items, ticksPerMeasure) {
    let slots = 1;
    for (const item of items) {
      const denom = ticksPerMeasure / gcd(item.tick, ticksPerMeasure);
      slots = lcm(slots, denom);
    }
    slots = Math.max(1, slots);
    const data = new Array(slots).fill("00");
    for (const item of items) {
      const index = Math.round((item.tick * slots) / ticksPerMeasure);
      if (index >= 0 && index < slots) data[index] = item.code;
    }
    return data.join("");
  }

  function directionToDirectional(direction) {
    if (direction === 1) return 3;
    if (direction === 2) return 4;
    return 1;
  }

  function lineTypeToDirectional(lineType) {
    if (lineType === 1) return 5;
    if (lineType === 2) return 2;
    return 0;
  }

  function tapTypeFromJson(note, fallback = 1) {
    if (note.noteBaseType === 11) return note.type ? 6 : 5;
    if (note.noteBaseType === 9 || note.noteBaseType === 12) return note.type ? 8 : 7;
    if (note.noteBaseType === 4) return 6;
    if (note.noteBaseType === 3) return note.type ? 2 : 1;
    if (note.noteBaseType === 1 || note.noteBaseType === 2) return note.type ? 2 : 1;
    return fallback;
  }

  function addTap(groups, ticksPerMeasure, note, tapType) {
    const lane = note.laneStart + 2;
    const width = note.laneEnd - note.laneStart + 1;
    addSusObject(
      groups,
      ticksPerMeasure,
      note.ticks,
      `1${toBase36(lane)}`,
      `${toBase36(tapType)}${toBase36(width)}`
    );
  }

  function addDirectional(groups, ticksPerMeasure, note, directionalType) {
    if (!directionalType) return;
    const lane = note.laneStart + 2;
    const width = note.laneEnd - note.laneStart + 1;
    addSusObject(
      groups,
      ticksPerMeasure,
      note.ticks,
      `5${toBase36(lane)}`,
      `${toBase36(directionalType)}${toBase36(width)}`
    );
  }

  function addSlide(groups, ticksPerMeasure, note, channel, decoration, slideType) {
    const lane = note.laneStart + 2;
    const width = note.laneEnd - note.laneStart + 1;
    const prefix = decoration ? "9" : "3";
    addSusObject(
      groups,
      ticksPerMeasure,
      note.ticks,
      `${prefix}${toBase36(lane)}${toBase36(channel)}`,
      `${toBase36(slideType)}${toBase36(width)}`
    );
  }

  function buildChains(notes) {
    const byId = new Map(notes.map((note) => [note.id, note]));
    const visited = new Set();
    const chains = [];
    for (const note of notes) {
      if (visited.has(note.id)) continue;
      if (note.nextConnectionId === -1 && note.previousConnectionId === -1) continue;
      if (note.previousConnectionId !== -1) continue;
      const chain = [];
      let current = note;
      while (current && !visited.has(current.id)) {
        chain.push(current);
        visited.add(current.id);
        current = current.nextConnectionId === -1 ? null : byId.get(current.nextConnectionId);
      }
      if (chain.length) chains.push(chain);
    }
    for (const note of notes) {
      if (
        !visited.has(note.id) &&
        (note.nextConnectionId !== -1 || note.previousConnectionId !== -1)
      ) {
        chains.push([note]);
        visited.add(note.id);
      }
    }
    return { chains, connectedIds: visited };
  }

  function jsonNoteToSusStandalone(groups, ticksPerMeasure, note) {
    if (note.noteBaseType === 3 || note.category === 3) {
      addTap(groups, ticksPerMeasure, note, tapTypeFromJson(note));
      addDirectional(groups, ticksPerMeasure, note, directionToDirectional(note.direction));
    } else if (note.noteBaseType === 11 || note.category === 4) {
      addTap(groups, ticksPerMeasure, note, tapTypeFromJson(note));
    } else if (note.noteBaseType === 4 || note.category === 8) {
      addTap(groups, ticksPerMeasure, note, 6);
      addDirectional(groups, ticksPerMeasure, note, 1);
    } else {
      addTap(groups, ticksPerMeasure, note, tapTypeFromJson(note));
    }
  }

  function jsonNoteToSusConnected(groups, ticksPerMeasure, note, channel, isLast) {
    const base = note.noteBaseType;
    const decoration = note.category === 9 || base === 10 || base === 13;
    let slideType = 3;

    if (base === 2 || base === 8 || base === 9 || base === 10) slideType = 1;
    else if (base === 1 || base === 3 || base === 11 || base === 12 || base === 13) slideType = 2;
    else if (base === 6) slideType = 5;
    else if (base === 5) slideType = 3;
    if (isLast) slideType = 2;

    addSlide(groups, ticksPerMeasure, note, channel, decoration, slideType);

    if (base === 3 || note.category === 3) {
      addDirectional(groups, ticksPerMeasure, note, directionToDirectional(note.direction));
      if (note.type) addTap(groups, ticksPerMeasure, note, 2);
    } else if (base === 8 || base === 11 || base === 9 || base === 12) {
      addTap(groups, ticksPerMeasure, note, tapTypeFromJson(note));
    } else if (note.type && (base === 1 || base === 2)) {
      addTap(groups, ticksPerMeasure, note, 2);
    }

    const directional = lineTypeToDirectional(note.noteLineType);
    if (directional) addDirectional(groups, ticksPerMeasure, note, directional);
  }

  function jsonToSus(scoreJson, options = {}) {
    const score = typeof scoreJson === "string" ? JSON.parse(scoreJson) : scoreJson;
    const ticksPerBeat = Number(options.ticksPerBeat ?? DEFAULT_TICKS_PER_BEAT);
    const ticksPerMeasure = ticksPerBeat * DEFAULT_BEATS_PER_MEASURE;
    const groups = new Map();
    const lines = [];

    lines.push("This file was generated by sus_json_converter.js.");
    lines.push(`#TITLE ${quoteSus(options.title ?? "")}`);
    lines.push(`#ARTIST ${quoteSus(options.artist ?? "")}`);
    lines.push(`#DESIGNER ${quoteSus(options.designer ?? "")}`);
    lines.push("#DIFFICULTY 0");
    lines.push("#PLAYLEVEL ");
    lines.push(`#SONGID ${quoteSus(options.songId ?? score.MusicId ?? "")}`);
    lines.push("#WAVE \"\"");
    lines.push("#WAVEOFFSET 0");
    lines.push("#JACKET \"\"");
    lines.push("");
    lines.push(`#REQUEST "ticks_per_beat ${ticksPerBeat}"`);
    lines.push("");

    const events = [...(score.MusicScoreEventDataList || [])].sort(
      (a, b) => a.ticks - b.ticks || a.eventType - b.eventType
    );
    const bpmEvents = events.filter((event) => event.eventType === 0);
    const bpmIds = new Map();
    let nextBpmId = 1;
    for (const event of bpmEvents) {
      const value = Number(event.changeValue);
      if (!bpmIds.has(value)) {
        bpmIds.set(value, nextBpmId);
        lines.push(`#BPM${toBase36(nextBpmId, 2)}: ${formatNumber(value)}`);
        nextBpmId += 1;
      }
      const id = bpmIds.get(value);
      addSusObject(groups, ticksPerMeasure, event.ticks, "08", toBase36(id, 2));
    }

    if (options.includeMeasureEvents) {
      for (const event of events) {
        if (event.eventType !== 3) continue;
        const length = timeSignatureToTicks(event.changeValue, ticksPerBeat);
        const ratio = length / ticksPerMeasure;
        const { bar, tick } = tickToBarTick(event.ticks, ticksPerMeasure);
        if (tick === 0 && Number.isFinite(ratio) && ratio > 0 && ratio !== 1) {
          lines.push(`#${String(bar).padStart(3, "0")}02: ${formatNumber(ratio)}`);
        }
      }
    }

    const notes = [...(score.NoteList || [])].sort(
      (a, b) => a.ticks - b.ticks || a.laneStart - b.laneStart || a.id - b.id
    );
    const { chains, connectedIds } = buildChains(notes);
    let nextChannel = 0;
    for (const chain of chains) {
      const channel = nextChannel % 36;
      nextChannel += 1;
      for (let index = 0; index < chain.length; index += 1) {
        const note = chain[index];
        jsonNoteToSusConnected(groups, ticksPerMeasure, note, channel, index === chain.length - 1);
      }
    }

    for (const note of notes) {
      if (!connectedIds.has(note.id)) {
        jsonNoteToSusStandalone(groups, ticksPerMeasure, note);
      }
    }

    const groupLines = [...groups.values()]
      .map((group) => ({
        bar: group.bar,
        header: group.header,
        data: buildSusData(group.items, ticksPerMeasure),
      }))
      .sort((a, b) => a.bar - b.bar || a.header.localeCompare(b.header));

    for (const line of groupLines) {
      lines.push(`#${String(line.bar).padStart(3, "0")}${line.header}: ${line.data}`);
    }

    return `${lines.join("\n")}\n`;
  }

  function stringifyScoreJson(scoreJson, options = {}) {
    const score = typeof scoreJson === "string" ? JSON.parse(scoreJson) : scoreJson;
    const space = options.pretty ? 2 : options.space ?? 0;
    if (!options.forceBpmFloat) return JSON.stringify(score, null, space);

    let placeholderIndex = 0;
    const placeholders = new Map();
    const clone = {
      ...score,
      MusicScoreEventDataList: (score.MusicScoreEventDataList || []).map((event) => {
        if (
          event.eventType !== 0 ||
          typeof event.changeValue !== "number" ||
          !Number.isInteger(event.changeValue)
        ) {
          return { ...event };
        }

        const key = `__SEKAI_BPM_FLOAT_${placeholderIndex}__`;
        placeholderIndex += 1;
        placeholders.set(key, `${event.changeValue}.0`);
        return {
          ...event,
          changeValue: key,
        };
      }),
      NoteList: (score.NoteList || []).map((note) => ({ ...note })),
    };

    let text = JSON.stringify(clone, null, space);
    for (const [key, value] of placeholders) {
      text = text.replaceAll(`"${key}"`, value);
    }
    return text;
  }

  function normalizeScoreJson(score) {
    return {
      ...score,
      MusicScoreEventDataList: [...(score.MusicScoreEventDataList || [])].sort(
        (a, b) => a.ticks - b.ticks || a.eventType - b.eventType || a.id - b.id
      ),
      NoteList: [...(score.NoteList || [])].sort(
        (a, b) => a.ticks - b.ticks || a.laneStart - b.laneStart || a.id - b.id
      ),
    };
  }

  const api = {
    parseSus,
    susToJson,
    jsonToSus,
    stringifyScoreJson,
    normalizeScoreJson,
  };

  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = typeof require === "function" ? require("path") : null;
    const isCli =
      typeof require === "function" &&
      require.main === module &&
      path &&
      process.argv[1] &&
      path.basename(process.argv[1]) === "sus_json_converter.js";
    if (isCli) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      const [mode, input, output] = process.argv.slice(2);
      if (!mode || !input || !output || !/^(sus2json|json2sus)$/.test(mode)) {
        console.error(
          "Usage: node sus_json_converter.js sus2json input.sus output.json\n" +
            "       node sus_json_converter.js json2sus input.json output.sus"
        );
        process.exit(2);
      }
      const inputText = fs.readFileSync(input, "utf8");
      if (mode === "sus2json") {
        const musicIdMatch = input.match(/(\d+)/);
        const json = susToJson(inputText, {
          musicId: musicIdMatch ? Number(musicIdMatch[1]) : 0,
        });
        fs.writeFileSync(output, `${JSON.stringify(json, null, 2)}\n`);
      } else {
        fs.writeFileSync(output, jsonToSus(JSON.parse(inputText)));
      }
    }
  }

  return api;
});
