# Iron Talon — แบบเกมและระบบ Browser Multiplayer ทีมละ 7 คน

วันที่วิเคราะห์: 12 กันยายน 2026

ฐานโค้ด: `ChumponphatRangsee/iron_talon`, branch `main`, commit `88e390fa97f7aa663240af3b23bfda05d0cbdef5`.

ขอบเขต: ตรวจ source และโครงสร้าง repository ผ่าน GitHub พร้อมออกแบบ gameplay, multiplayer, browser UX และแผนพัฒนา งานนี้ยังไม่ได้แก้โค้ดเกม รันเกมจริง หรือทดสอบโหลด ดังนั้นจำนวนผู้เล่นและ performance ด้านล่างเป็นข้อกำหนดและเป้าหมายที่ต้องพิสูจน์ ไม่ใช่ผล benchmark

## 1. ข้อเสนอหลัก

ต่อยอดเป็น **เกมยิง tactical มุมสูง 3D แบบ co-op PvE จำนวน 1–7 คนต่อห้อง** โดยประสบการณ์หลักออกแบบสำหรับทีมเต็ม 7 คน ภารกิจหนึ่งยาว 12–18 นาที ผู้เล่นร่วมมือบุกฐาน ทำ objective และถอนกำลัง

สมมติฐาน: คำว่า “ทีมละ 7 คน” หมายถึงทีมร่วมมือกันก่อน หากต้องการแข่งขัน 7v7 ให้ใช้ข้อกำหนดส่วน 11 เพิ่ม โดยหนึ่งแมตช์จะมี 14 คน ไม่ใช่ 7 คน

เก็บ React + Vite และ Three.js renderer เดิม ใช้ภาพ low-poly และแผนที่เดิมเป็นต้นแบบ การย้ายเป็น Phaser หรือเขียน renderer ใหม่ไม่ใช่เงื่อนไขของ multiplayer สำหรับโค้ดนี้ React Three Fiber เป็นทางเลือกภายหลังเมื่อมีประโยชน์ด้าน scene composition; simulation ต้องแยกออกจากทั้ง React และ Three.js ไม่ว่าใช้ renderer ใด

## 2. สิ่งที่มีแล้ว และช่องว่างจาก source

| ส่วน | หลักฐานปัจจุบัน | ผลต่อแผนพัฒนา |
|---|---|---|
| Frontend | `package.json`: React 19, Vite 6; `App.jsx` โหลด Three.js r128 จาก CDN | ใช้ต่อได้ แต่ควรติดตั้ง Three.js ผ่าน dependency ที่ pin version พร้อม loading/error state |
| เกม 3D | Perspective camera มองเฉียงจากด้านบน, อาคาร ที่กำบัง ถังระเบิด ทหารที่สร้างจาก geometry | เก็บภาพและกล้องเดิมเป็น baseline |
| การต่อสู้ | เดิน ยิง รีโหลดอัตโนมัติ dodge, grenade, airstrike, drone | แยกกฎ combat ออกจาก mesh ก่อนนำขึ้น server |
| ศัตรู | rifleman, shotgunner, heavy, sniper, grenadier | ใช้เป็น roster เริ่มต้น เพิ่มการเลือกเป้าหมายหลายคน |
| Wave | 5 wave มีศัตรู 4, 5, 6, 7, 10 ตัวตามลำดับ | จำนวนและ objective ปัจจุบันออกแบบสำหรับคนเดียว |
| สถานะผู้เล่น | `G.player` หนึ่งตัว; AI และกล้องอ้างถึงตัวนี้ | เปลี่ยนเป็น `players[playerId]`; กล้องตาม local player |
| โครงสร้าง | `engine.js` 950 บรรทัด; scene/enemies index ที่ตรวจเป็น `export {}` | มีโครง folder แต่ subsystem ที่ตรวจยังไม่ได้ย้าย logic ออกจริง |
| Multiplayer | ไม่มี server หรือ network client ใน tree ที่ตรวจ | ต้องเพิ่มห้อง, session, protocol, authority, reconnect |
| Browser UX | HUD React; canvas สูงคงที่ 510px; ไม่พบ resize handler ใน engine | เพิ่ม responsive viewport, resize, context recovery, focus handling |
| Touch | มี `G.joy` แต่ไม่พบ touch/pointer binding ใน engine ที่ตรวจ | ยังรับรอง mobile controls ไม่ได้; desktop เป็น gate แรก |
| คุณภาพ | `npm test` เป็น placeholder ที่ exit 1; ไม่พบ CI ใน tree | เพิ่มการตรวจ simulation และ multiplayer ที่มีผลต่อ correctness |

แหล่งโค้ด: [package.json](https://github.com/ChumponphatRangsee/iron_talon/blob/88e390fa97f7aa663240af3b23bfda05d0cbdef5/package.json), [App.jsx](https://github.com/ChumponphatRangsee/iron_talon/blob/88e390fa97f7aa663240af3b23bfda05d0cbdef5/src/App.jsx), [engine.js](https://github.com/ChumponphatRangsee/iron_talon/blob/88e390fa97f7aa663240af3b23bfda05d0cbdef5/src/game/engine.js), [constants.js](https://github.com/ChumponphatRangsee/iron_talon/blob/88e390fa97f7aa663240af3b23bfda05d0cbdef5/src/game/core/constants.js).

### ประเด็นที่ควรแก้ก่อนขยายผู้เล่น

1. **Simulation ผูกกับ rendering** — ตำแหน่งจริงอ่านจาก `mesh.position`, เวลาใช้ frame-normalized dt ใน requestAnimationFrame และมี setTimeout เปลี่ยน gameplay จึงยังนำไปใช้เป็น headless server โดยตรงไม่ได้ เปลี่ยนเป็นข้อมูลตัวเลข, fixed timestep และ scheduled events ตาม server tick
2. **Grenadier มีปัญหาลำดับเงื่อนไข** — เมื่ออยู่ในระยะยิงปกติ `<10` และเห็นผู้เล่น บล็อกยิงจะตั้ง `shootTimer` ใหม่ก่อนตรวจบล็อกปาระเบิดที่ต้องการ `shootTimer<=0` ทำให้ไม่ปาระเบิดในเงื่อนไขนั้น ยังอาจปาได้ในช่วงระยะ 10–11 นี่เป็นข้อค้นพบจาก control flow ที่ต้องยืนยันด้วย test
3. **Restart และ delayed events** — `restart()` ไม่ล้าง gameplay timeouts; wave/airstrike/barrel callback เก่าอาจกระทบ match ใหม่ และถังที่นำกลับเข้า scene ไม่ได้สร้าง wall collider ที่ลบไปคืน ควร reset จาก map definition และใช้ match generation ID ยกเลิก event เก่า
4. **Resource lifecycle** — มี `renderer.dispose()` แต่ไม่พบการจัดการ dispose geometry/material ครบวงจรหรือปิด AudioContext; bullets/particles สร้าง object ใหม่และถอดจาก scene บ่อย ต้องใช้ pooling/shared resources พร้อม teardown ตาม ownership และตรวจ memory plateau
5. **การเล็งยังไม่ใช่ยิงไปตามเมาส์โดยอิสระ** — โค้ดเลือกศัตรูใกล้ที่สุดและเปลี่ยนเป้าหมายด้วย aim assist; เมื่อไม่มีเป้าหมายจะยิงไม่ได้ ควรล็อกกติกาใหม่ให้ชัดว่า desktop ยิงตาม aim direction
6. **ศัตรูไม่มี pathfinding เต็มระบบ** — ใช้ seek/patrol และ LOS sampling; เพิ่ม navigation grid หรือ waypoint ที่คำนวณบน server เมื่อ objective ต้องเดินอ้อมอาคาร ตรวจ ray/segment กับ collider เพื่อไม่พลาดสิ่งกีดขวางบางชิ้น

## 3. รูปแบบการเล่น: Operation Black Relay

ผู้เล่นเป็นหน่วยจู่โจมที่ต้องขโมยข้อมูลจากสถานีสื่อสาร แต่เมื่อเริ่มเจาะระบบ ศัตรูจะส่งกำลังเสริมเข้ามา ความสนุกหลักคือเลือกตำแหน่งยิง ช่วยเพื่อน จัดการทรัพยากร และตัดสินใจว่าจะเสี่ยงทำภารกิจเสริมหรือถอนตัว

### ลำดับหนึ่งรอบ

| ช่วง | เวลาเป้าหมาย | สิ่งที่ผู้เล่นทำ |
|---|---|---|
| Lobby และ briefing | 1–2 นาที นอกเวลา mission | สร้างห้อง ส่ง invite เลือก loadout ตรวจ ready |
| Insertion | 2–3 นาที | เข้าฐาน สำรวจเส้นทาง ทำลายหน่วยลาดตระเวน |
| Relay objectives | 3–5 นาที | ปิดระบบรักษาความปลอดภัย 2 จุด เลือกแยกทีมทำพร้อมกันหรือรวมทีมทำทีละจุด |
| Data holdout | 3–4 นาที | คุ้มกัน uplink ระหว่างดาวน์โหลดข้อมูล รับมือศัตรูหลายทิศ |
| Extraction | 2–3 นาที | นำ data core ไป LZ ป้องกันจุดถอนกำลังและช่วยเพื่อนกลับ |
| เวลาเผื่อ/ภารกิจเสริม | 2–3 นาที | เปิดคลังเสบียงหรือช่วยตัวประกันเพื่อรางวัลเสริม |

เวลาเป้าหมายของ mission 12–18 นาที แต่ hard timeout เริ่มทดลองที่ 20 นาที; ต้อง playtest แล้วปรับ

### แผนที่และการแบ่งทีม

- ใช้โครง compound เดิมเป็น greybox; เพิ่ม 2 เส้นทางไป relay และจุดเชื่อมกลาง ไม่ต้องบังคับ split ด้วยกลไกเปิดพร้อมกัน
- กลุ่ม A: Assault, Breacher, Medic — บุกและยึดพื้นที่
- กลุ่ม B: Heavy, Marksman, Engineer — คุ้มกันอีกเส้นทางและ objective
- Recon เป็นคนยืดหยุ่น เชื่อมข้อมูลและช่วยกลุ่มที่ต้องการกำลัง ไม่ใช่ผู้บังคับบัญชาที่ควบคุมคนอื่น
- จุดปะทะต้องมีที่กำบังอย่างน้อย 2–3 ตำแหน่งให้เลือก เส้นทางอ้อม และทางถอย ตรวจด้วยผู้เล่นจริงว่าทางแคบไม่ทำให้ 7 คนอัดกัน
- กล้องตามผู้เล่นแต่ละคน มี team markers และขอบจอชี้ตำแหน่งเพื่อน ไม่ใช้กล้องเดียวที่ต้องเห็นทั้งทีมตลอดเวลา

## 4. บทบาททีม 7 คน

| บทบาท | หน้าที่ | Skill ตัวอย่าง | ข้อจำกัดเพื่อสมดุล |
|---|---|---|---|
| Assault | ยืดหยุ่นและคุมพื้นที่ | Smoke cover | DPS กลาง ไม่มี burst สูงสุด |
| Breacher | เปิดทางระยะใกล้ | Breach charge / stun | ระยะยิงสั้น ต้องมีคนคุ้มกัน |
| Heavy | ยิงกดดันและรับแนวหน้า | Deployable frontal shield | เคลื่อนช้าขณะใช้งาน กระสุน/heat จำกัด |
| Medic | ลดเวลาที่ทีมเสียกำลังรบ | Fast revive / healing pack | ฮีลมี charge และ cooldown |
| Engineer | ซ่อม objective และเติมเสบียง | Turret หรือ ammo station | เลือกอุปกรณ์หนึ่งแบบ; จำกัด active ต่อคน |
| Recon | เปิดข้อมูลและสนับสนุนการตัดสินใจ | Drone scan / mark | Scan เป็นช่วงเวลา ไม่เห็นทั้งแผนที่ถาวร |
| Marksman | จัดการ sniper และเป้าหมายสำคัญ | Precision shot | ยิงช้า เสียเปรียบระยะประชิด |

7 บทบาทเป็น composition แนะนำ ไม่บังคับมีทุก role จึงเข้าเล่นกับเพื่อนน้อยคนได้ ทุกคน revive และ interact objective ได้ Medic ทำได้เร็วขึ้น Engineer ซ่อมได้มีประสิทธิภาพขึ้น MVP อนุญาตซ้ำได้สูงสุด 2 คนต่อ role และ turret รวมไม่เกิน 2 ตัวต่อทีม ปรับจาก telemetry ภายหลัง

ทุกคนมีอาวุธหลัก dodge และ interaction; Q เป็น class skill, G เป็น utility, F เป็น ping/context communication, E เป็น interact/revive, R reload, Tab แผนที่/รายชื่อทีม ไม่ใช้ airstrike ส่วนตัวที่กดได้พร้อมกัน 7 คน: เปลี่ยนเป็น support ส่วนกลาง ใช้แต้มที่ทีมได้จาก objective และ cooldown กลาง ทุกคนร้องขอได้ server รับคำขอแรกที่ถูกต้อง

### กติกาแพ้ชนะและการช่วยเพื่อน

- HP หมดเข้าสถานะ downed 30 วินาที; เพื่อนกดช่วยในระยะ 2 world units ใช้เวลาเริ่มต้น 5 วินาที Medic 3 วินาที การรับ damage ขัดจังหวะ revive
- ทุกคน downed/dead พร้อมกันถือว่า squad wiped; ไม่มี self-revive ใน MVP เพื่อให้เงื่อนไขชัดเจน
- ตายแล้วรอ reinforcement ที่ checkpoint ใช้แต้มทีมจำนวนจำกัดเริ่มต้น 3 ครั้งต่อภารกิจ
- ชนะเมื่อ data core และผู้เล่นที่ยังมีชีวิตอย่างน้อย 1 คนออกจากพื้นที่ถอนกำลังสำเร็จ; มี bonus สำหรับช่วยออกมาครบ ผู้ที่ไม่ทัน LZ ถือว่า missing และไม่ได้ extraction bonus
- Data core หล่นในตำแหน่งที่เข้าถึงได้เมื่อผู้ถือ downed/disconnect เพื่อไม่ล็อกภารกิจ
- แพ้เมื่อ squad wiped, uplink ถูกทำลายก่อนโหลดข้อมูลเสร็จ หรือหมด hard timeout
- Normal mode ปิด friendly fire ทั้งกระสุนและ ability; สภาพแวดล้อมอันตรายทำ damage ตามกติกาชัดเจน ไม่นำสูตรระเบิดของ single-player มาใช้โดยไม่มี `ownerId/teamId`
- ผู้เล่นเพื่อนร่วมทีมเดินทะลุกันได้ใน MVP เพื่อไม่ให้อุดประตู กล้องและ marker ต้องยังบอกตำแหน่งได้

### ความยากและแรงจูงใจ

ใช้ enemy roster เดิมและสร้างความยากจากทิศโจมตี ตำแหน่ง objective และจำนวนหน่วยพิเศษ ไม่เพิ่ม HP ทุกตัว 7 เท่า ทดลอง HP ศัตรูธรรมดาคงที่ก่อนและให้ encounter budget เพิ่มตามจำนวนผู้เล่น ณ checkpoint เริ่มต้นใช้ `baseBudget × (0.6 + 0.4 × activePlayers)` เป็นค่าทดลอง ไม่ใช่สูตรสมดุลที่ยืนยันแล้ว

กำหนด cap เริ่มต้น 30 AI active/ห้อง, 120 gameplay projectiles และ 2 turret; ทั้ง simulation และ load test ต้องใช้ cap เดียวกัน ปรับ difficulty เมื่อถึง checkpoint ไม่เปลี่ยน HP ศัตรูที่กำลังสู้เมื่อมีคนหลุด

คะแนนเน้น objective, extraction, assists, revives และ ammo supplied มากกว่า kill เพียงอย่างเดียว Progression เริ่มจาก badge/cosmetic และ sidegrade; ไม่เพิ่มพลังถาวรจนเพื่อนใหม่เล่นด้วยไม่ได้ Match result ให้ server คำนวณและบันทึกครั้งเดียว

## 5. Browser experience

เส้นทางผู้ใช้: เปิด URL → ใส่ชื่อ/รับ guest session → สร้างหรือเข้าห้องจากลิงก์ → เลือก role → ready → โหลด asset/map version → เล่น → debrief → rematch

- Desktop keyboard/mouse เป็น acceptance gate แรก: Chrome, Edge และ Firefox รุ่น stable ณ วันทดสอบ; macOS Safari อยู่ใน compatibility matrix เพิ่มเติม
- Mobile เป็นขั้นถัดไป: landscape, twin-stick, aim assist ที่มีขอบเขตและ server ตรวจ, skill buttons 44–48 CSS px, ลดเงาและเอฟเฟกต์ ไม่แสดงว่ารองรับครบจนทดสอบ touch จริง
- HUD desktop: objective และ squad status รวมเป็น cluster มุมซ้ายบน; HP/ammo/skill เป็น compact cluster มุมล่างซ้าย; mini-map เปิดด้วย Tab หรือย่อไว้ตามความจำเป็น พื้นที่กลางและล่างกลางเว้นสำหรับการเล็ง
- ชื่อ/หมายเลข 1–7/role icon แยกเพื่อนด้วยรูปทรงและตัวเลขร่วมกับสี; แสดง downed timer, offscreen direction และ ping ที่มีอายุ
- เก็บ score detail, controls, graphics และ roster แบบเต็มไว้ใน overlay; persistent HUD ไม่ควรกินเกินประมาณ 20–25% ของจอ desktop
- ESC เปิดเมนูและหยุดส่งคำสั่ง local character แต่โลก multiplayer ยังเดินต่อ; ล้าง input เมื่อ blur/visibilitychange เพื่อไม่เดินหรือยิงค้าง
- ใช้ ResizeObserver, pixel ratio cap และ quality preset; รองรับ WebGL context loss ด้วยหน้ากู้คืน renderer โดยรักษา network session เท่าที่ทำได้
- เสียงเริ่มหลัง user gesture, มี mute/volume; ลด camera shake และ screen flash ได้
- Voice chat ยังอยู่นอก MVP ใช้ ping wheel สำหรับ “มาทางนี้/ศัตรู/ต้องการช่วย/กระสุน” ก่อน

## 6. Architecture ที่เสนอ

| ชั้น | ตัวเลือก | ขอบเขตหน้าที่ |
|---|---|---|
| Browser client | React + Vite + Three.js | input, rendering, audio, HUD, prediction, interpolation |
| Shared package | TypeScript | data schema, protocol version, input rules, movement/collision primitives, map definition |
| Game server | Node.js + Colyseus | room lifecycle, 7-seat limit, authoritative simulation, AI, combat, objective, reconnect |
| Static delivery | static hosting/CDN | HTML, JS, assets ที่มี content hash |
| Persistence | PostgreSQL เมื่อเริ่มเก็บ progression | profile, completed match, participation, reward ledger; server เขียนผล |
| Multi-process coordination | Redis เมื่อขยายเกินหนึ่ง process | room directory/presence และ matchmaking coordination; ไม่ทำหน้าที่แทน simulation ของห้อง |
| Operations | container/process supervisor + telemetry | health, room count, tick time, errors, bandwidth, drain-on-deploy |

เหตุผลเลือก Colyseus: เป็น framework สำหรับ authoritative Node.js game server มี room/matchmaking และ state synchronization อยู่แล้ว จึงลดส่วนโครง network ที่ต้องเขียนเอง แต่กฎ combat, validation และ scaling benchmark ยังเป็นงานของโปรเจกต์ [เอกสาร Colyseus](https://docs.colyseus.io/)

เริ่มด้วย game server แบบ long-running process ใน region ใกล้ผู้เล่นไทย เลือกผู้ให้บริการหลังทดลอง latency จริง static hosting อย่างเดียวไม่เพียงพอ และไม่ใช้ short-lived HTTP function รัน loop ของแมตช์ต่อเนื่อง

ห้องหนึ่งมี simulation owner เพียง process เดียว; หลายห้องกระจายข้าม process/เครื่องได้ จำนวนเครื่องยังสรุปไม่ได้จนมี benchmark ของเกมนี้ Lobby leader เป็นสิทธิ์ ready/start เท่านั้น ไม่ใช่เครื่องที่คำนวณโลก

### โครง source เป้าหมาย

| Path เสนอ | เนื้อหา |
|---|---|
| `apps/client/src/game/render/` | scene, camera, meshes, interpolation, FX |
| `apps/client/src/game/input/` | physical inputs → semantic actions, focus reset |
| `apps/client/src/game/network/` | connect, join, snapshots, prediction/reconcile |
| `apps/client/src/ui/` | lobby, compact HUD, role picker, debrief |
| `apps/server/src/rooms/` | SquadRoom, admission, lifecycle, reconnect |
| `apps/server/src/simulation/` | movement, combat, AI, objectives, revive, tick scheduler |
| `apps/server/src/services/` | guest/auth session, result persistence, rate limits |
| `packages/shared/src/` | serializable types, protocol, balance config, collision math |
| `packages/content/` | versioned map/collider definitions, manifest |
| `tests/` | simulation invariants, room isolation, multiplayer load scenarios |

## 7. Network contract และการป้องกัน state ผิดกัน

ค่าเริ่มต้นสำหรับทดลอง: simulation 30 ticks/sec; snapshots/delta patches 15–20 ครั้ง/sec; client render ตามจอ เป้าหมาย 60 FPS; input flush สูงสุด 30 ครั้ง/sec และ batch edge actions เพื่อไม่ทำปุ่มกดสั้นหาย ตัวเลขทั้งหมดต้องปรับจาก latency และ CPU trace

Client ส่ง **คำสั่ง** เช่น movement axis, aim direction, fire/reload/skill/interact ไม่ส่ง HP, damage, kill หรือ final position ที่ server เชื่อโดยตรง

Input envelope: `protocolVersion, matchId, sequence, inputTick, moveX, moveZ, aimX, aimZ, buttons, actions[]` โดย action แบบกดครั้งเดียวมี `actionId` สำหรับ deduplication ใช้ token ผูก playerId ฝั่ง server ไม่รับสิทธิ์จาก playerId ที่ client ระบุเอง

Server ตรวจ schema/finite numbers, speed/acceleration limits, aim normalization, ammo, cooldown, range, LOS, objective state และเจ้าของ entity จำกัด message size/rate และปฏิเสธ sequence เก่าหรือซ้ำ สำหรับ held input ที่หายเกิน 250ms ให้คืน neutral เพื่อไม่เดินหรือยิงค้าง

Snapshot: `matchId, serverTick, acknowledgedInputSequence, players, enemies, projectiles, objectives, supportBudget, phase` entities มี ID คงที่ และมี owner/team สำหรับความเสียหาย Event เช่น explosion/revive มี eventId ป้องกันเล่นเสียง/FX ซ้ำ ไม่ส่ง particle mesh, material หรือ React state ผ่าน network

Local player ใช้ movement prediction แล้ว reconcile กับ server; remote entities ใช้ interpolation buffer เริ่มต้น 100ms ไม่คาดเดา HP, reward หรือผล hit เอง กระสุนเป็น server-simulated projectile ใน MVP และใช้ swept collision กับทั้งกำแพงและเป้าหมาย เพื่อลดความจำเป็นของ hitscan rewind หากเพิ่ม hitscan ภายหลังต้องกำหนด bounded lag compensation แยก

Map geometry กับ collider ใช้ map version/hash เดียวกันทั้งสองฝั่ง การสุ่มศัตรูและเหตุการณ์ gameplay อยู่บน server เท่านั้น; client random ใช้เฉพาะ decoration/FX ที่ไม่ส่งผลต่อ collision

## 8. ห้อง 7 คนและ reconnect

สถานะห้อง: `lobby → loading → countdown → active → extraction → results → disposed` พร้อมทางออก `aborted` สำหรับ server error ผลล้มเหลวจาก gameplay ไป results ตามปกติ

- MVP private rooms: invite code/link สุ่มเดายาก, rate limit การลอง code; server บังคับสูงสุด 7 active/reserved seats รวมกัน
- ไม่ใช้การนับเฉพาะจำนวน socket เพื่อกำหนดความจุ ต้องรวม reservation สำหรับ loading/reconnect; ทดสอบการ join พร้อมกันเพื่อไม่ให้เกิดคนที่ 8
- Guest token อายุสั้นออกโดย server ผ่าน HTTPS; reconnect token เป็นสิทธิ์ส่วนตัวไม่ใส่ในลิงก์ invite; validate origin และ session ทุก reconnect
- เริ่มเกมเมื่อผู้เล่นปัจจุบัน 1–7 คนพร้อมและโหลด asset/map version สำเร็จ ไม่ต้องรอครบ 7; เป้าทดสอบหลักต้องครบ 7
- เมื่อ active ล็อกการเข้าของผู้เล่นใหม่ใน MVP อนุญาตเฉพาะ reconnect ที่เป็นสมาชิกเดิม
- หลุดแล้วเก็บที่นั่งไว้ 60 วินาที; ล้าง input ทันทีเมื่อทราบว่า disconnected ตัวละครอยู่ในโลกและยังรับ damage ได้ เพื่อไม่ให้ใช้ disconnect หลบการโจมตี
- เมื่อ reconnect ส่ง full snapshot และ resync sequence, ammo, cooldown, objective โดยไม่สร้างตัวละครหรือรางวัลซ้ำ ไม่มีรับรองการคืนสภาพก่อนถูกโจมตี
- หมด 60 วินาที ลบ reservation ย้ายผู้เล่นเป็น abandoned และคืน data core หากจำเป็น ปรับความยากที่ checkpoint ถัดไป ผู้เล่นใหม่เข้าทดแทนได้ในรอบถัดไป
- Leader หลุดให้ผู้เล่นที่เชื่อมอยู่รับสิทธิ์ lobby ต่อ เกมบน server ไม่หยุด
- ทุกคนหลุดให้เวลา reconnect แล้ว dispose; มี TTL สำหรับ lobby ว่าง ปิด timer และ resources ทุกครั้ง
- Server crash ต่างจาก client disconnect: MVP จบแมตช์เป็น interrupted และกลับ lobby ไม่อ้างว่ากู้แมตช์กลางเกมได้ หากต้องการ crash recovery ต้องเพิ่ม checkpoint persistence และ recovery protocol ต่างหาก
- Result บันทึกด้วย unique matchId/participantId และ idempotent reward transaction; ถ้าฐานข้อมูลขัดข้องใช้ durable pending-results retry และแสดง reward pending โดยไม่ replay reward

## 9. Capacity และเกณฑ์พิสูจน์

**7 คนต่อห้องเป็นกติกา admission ส่วนจำนวนคนพร้อมกันทั้งระบบคือ capacity อีกเรื่องหนึ่ง**

| ระยะทดสอบ | โหลด | สิ่งที่ต้องผ่าน |
|---|---|---|
| Functional | 1 ห้อง × 7 คน | เข้าได้ 7 คน คนที่ 8 ถูกปฏิเสธ; เห็นโลกเดียวกันและเล่นจบ |
| Isolation | 2 ห้อง × 7 คน | state, events, AI, rewards ไม่ข้ามห้อง |
| Alpha target | 10 ห้อง × 7 คน = 70 CCU | วัดด้วย combat จริงตาม entity cap และ soak 60 นาที |
| Growth experiment | 50 ห้อง × 7 คน = 350 CCU | capacity ramp ข้ามหลาย process ตามผลวัด ไม่ถือว่าเครื่องเดียวรองรับได้ |

บน server 30Hz มีงบ 33.3ms/tick; ตั้งเป้า simulation p95 ≤20ms ต่อห้องและ p99 <33.3ms พร้อมวัด event-loop lag รวมทั้ง process เพราะหลายห้องแชร์ CPU หากไม่ผ่านให้ลด room density หรือปรับ AI/collision ก่อนเพิ่มโหลด

Client gate: บนเครื่องทดสอบ integrated GPU ที่ระบุรุ่นและ resolution ชัดเจน ตั้งเป้า p95 frame time ≤20ms ที่ 1080p quality medium; low preset ต้องรักษา ≥30 FPS ใน combat peak วัด renderer.info, draw calls และ memory หลัง rematch หลายรอบ ต้องไม่เติบโตต่อเนื่อง

Network gate: ทดสอบ RTT 50/100/200ms, jitter และ packet loss ที่ระดับ transport (WebSocket มี head-of-line delay) วัด movement correction, input acknowledgement, reconnect duration และ bytes/sec ไม่สรุปประสิทธิภาพจาก idle sockets

งบ bandwidth เบื้องต้นเพื่อออกแบบ: downstream เฉลี่ย ≤30 KB/s ต่อ client ระหว่าง mission; ที่ 7 คนประมาณ 210 KB/s ต่อห้อง และ 10 ห้องประมาณ 2.1 MB/s หรือ 16.8 Mbps payload ขาออก ไม่รวม overhead และ spike นี่เป็น budget ไม่ใช่ขนาด packet ที่วัดแล้ว

ชุดทดสอบสำคัญ: forged HP/teleport/ammo, duplicate fire/reward, simultaneous join, reconnect ขณะ downed/ถือ core, server disconnect, cross-room leakage, restart ที่มี explosion ค้าง, cooldown เหมือนกันที่ render 30/60/144 FPS, memory หลัง rematch 20 รอบ, resize/fullscreen, focus loss และ UI ไม่บัง crosshair

## 10. Roadmap ที่ส่งต่องานพัฒนาได้

| ลำดับ | Deliverable | Acceptance gate |
|---|---|---|
| P0 — Foundation | pin Three.js, แยก simulation data/timestep, map colliders, reset/lifecycle, แก้ grenadier control flow | headless simulation เดิน/ยิง/ชน/จบ wave ได้; browser เดิมยังเล่นได้; restart ไม่รับ event เก่า |
| P1 — Network slice | Node/Colyseus server, guest session, private lobby 7 seats, input + snapshot, movement prediction | 2 browsers เดิน/ยิงเห็นกัน จากนั้น 7 independent clients; คนที่ 8 เข้าไม่ได้ |
| P2 — Co-op mission | multi-target AI, role skills, revive, relay/data/extraction, shared support | 7 คนเล่นภารกิจจบได้จริง; ทุก role มีส่วนต่อ objective; แพ้ชนะตรงกัน |
| P3 — Reliability | reconnect, room isolation, security validation, result idempotency, deployment drain | หลุดกลับมาไม่เกิดผู้เล่นซ้ำ; สองห้องไม่ปน; deploy ไม่ตัดห้องที่กำลังเล่น |
| P4 — Capacity alpha | telemetry, entity pooling/caps, 70-CCU combat load, cross-browser playtest | ผ่านเกณฑ์ tick/frame/network บน environment ที่บันทึกไว้ จึงประกาศ capacity alpha |
| P5 — Expansion | mobile touch, more maps, progression, optional 7v7 | ประเมินจาก retention/playtest และทำ capacity gate ใหม่ตาม mode |

MVP ไม่จำเป็นต้องมี voice, ranked, shop, seamless server recovery, battle pass หรือ 7 map ให้ได้หนึ่ง mission ที่ทีม 7 คนเล่นสนุกและจบได้ก่อน

ลำดับ PR เสนอ: (1) simulation extraction และ regression fixes (2) room/server + movement (3) authoritative combat + AI (4) lobby/reconnect (5) mission/roles/HUD (6) operations/load gates. หลังเริ่ม P1 ควรทำ branch integration ให้ client และ protocol version ตรงกันเสมอ

## 11. หากต้องการ 7 ต่อ 7

ใช้ room type แยก `CompetitiveRoom` หรือ mode config ที่ผ่าน validation: `teamSize=7`, `teams=2`, รวม 14 player slots และไม่มี spectator ใน limit นี้สำหรับ MVP ของ mode

รูปแบบที่เข้ากับเกม: **Relay Control 7v7** — ยึดจุด A/B/C ทีมที่คุมอย่างน้อย 2 จุดสะสมคะแนน ชนะที่ 500 คะแนนหรือมากกว่าตอนครบ 12 นาที; เสมอให้ sudden-death control แบบมี timeout และ draw fallback กำหนดค่าจาก playtest อีกครั้ง

งานเพิ่มที่ข้ามไม่ได้: team assignment/party rules, spawn protection และ anti-spawn-camp, map สมมาตร, PvP damage/TTK ใหม่, rank/leave rules ตามต้องการ, fog-of-war แบบ server-filtered, ไม่ส่งศัตรูนอก visibility ให้ client, anti-cheat เพิ่มเติม, bounded lag compensation หากใช้ hitscan และ load test 14 คนต่อห้อง

Shared simulation และ owner/team ID จาก PvE ช่วยให้ต่อยอดได้ แต่ไม่ใช่การเปลี่ยน maxClients จาก 7 เป็น 14 แล้วพร้อมเปิดเล่น

## 12. สถานะส่งมอบ

ส่งมอบการวิเคราะห์ source, gameplay specification, browser flow, multiplayer architecture, protocol boundaries, room policy, capacity targets และ roadmap แล้ว ยังไม่มี implementation หรือ production deployment จากงานนี้ จุดเริ่มพัฒนาที่ชัดเจนคือ P0 แล้วทำ P1 ให้ 7 browser clients อยู่ใน world เดียวกันก่อนขยาย content
