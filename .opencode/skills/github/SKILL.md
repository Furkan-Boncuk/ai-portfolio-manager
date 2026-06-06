---
name: github
description: Use ONLY when the user explicitly asks for git operations — commit, push, pull, branch, status, or merge. Handles all GitHub workflow: branching per task, professional commit messages, and safe push/pull. NEVER performs destructive git operations without user confirmation.
---

# GitHub — Git ve GitHub İş Akışı

> Bu skill sadece **kullanıcının açık talimatıyla** çalışır.
> Asla izinsiz commit, push, merge veya branch silme yapılmaz.
> Her kritik işlem öncesi kullanıcıya onay sorulur.

---

## 1. Temel Kurallar

| Kural | Açıklama |
|-------|----------|
| **İzinsiz işlem yok** | Commit, push, merge, branch silme — hepsi kullanıcı onayıyla |
| **Her task için ayrı branch** | Yeni bir task başlarken **her zaman kullanıcıya sor**: "Yeni branch açıyorum, onaylıyor musun?" veya "Bu task'ı mevcut branch'te mi yapalım yoksa yeni branch mi açalım?" |
| **Bir branch = bir task** | Aynı branch'e birden fazla task commit'i asla yapılmaz. Yeni task = yeni branch. Eğer son push'tan sonra yeni task geldiyse **yeni branch açılır** |
| **Push öncesi branch kontrolü** | Push'tan önce `git branch --show-current` yap, hangi branch'te olduğunu kullanıcıya söyle ve onay al |
| **Anlamlı commit mesajı** | Conventional Commits formatı, ne yapıldığını açıklar |
| **Tek commit = tek iş** | Birden fazla konuyu tek commit'te birleştirme |
| **Status önce** | Her işlemden önce `git status` ve `git log --oneline -5` göster |
| **Conflict riski** | Push öncesi `git pull --rebase` yap, conflict varsa kullanıcıya bildir |

---

## 2. Branch Stratejisi

### Branch İsimlendirme

```
<numara>-<type>/<kisa-aciklama>
```

| Parça | Açıklama |
|-------|----------|
| `0001-` | Sıralı numara (zaten kullanılmış numaralar atlanır, bir sonraki boş numara alınır) |
| `feat/` | Yeni özellik (feature) |
| `fix/` | Hata düzeltmesi |
| `refactor/` | Kod iyileştirme, yapısal değişiklik |
| `docs/` | Dokümantasyon |
| `chore/` | Tool/config/bağımlılık değişikliği |

| Type | Ne Zaman |
|------|----------|
| `feat/` | Yeni özellik (feature) |
| `fix/` | Hata düzeltmesi |
| `refactor/` | Kod iyileştirme, yapısal değişiklik |
| `docs/` | Dokümantasyon |
| `chore/` | Tool/config/bağımlılık değişikliği |

Örnekler:
```
0001-feat/decisions-placeholder-page
0002-fix/telegram-duplicate-notification
0003-refactor/service-layer-extraction
0004-docs/github-skill
0005-feat/positions-page
```

### Branch Numarası Seçimi

Agent her branch açışında projedeki mevcut branch'leri kontrol eder ve **en yüksek numarayı bulup +1 ekler**:

```bash
# Mevcut branch'lerden en yüksek numarayı bul
git branch -a | grep -oP '^\s*\K[0-9]+(?=-)' | sort -n | tail -1
# → 4 ise yeni branch 0005-... olur
```

- Zaten varolan bir numara tekrar kullanılmaz.
- Numaralar sürekli artar, asla resetlenmez.
- Branch silinse bile o numara bir daha kullanılmaz.

### Akış

```
1. Agent: `git branch -a` ile mevcut branch'leri tara, en yüksek numarayı bul
2. Kullanıcı: "Decisions sayfasını yap" dediğinde
3. Agent: git status kontrol et, temiz mi?
4. Agent: Yeni numara = son numara + 1 (ör. mevcut son branch 0004 ise 0005)
5. Agent: `git checkout -b 0005-feat/decisions-page` ile branch aç
6. Agent: branch'te olduğunu doğrula
7. Agent: kodu yaz
8. Kullanıcı: "Tamam pushla" dediğinde
9. Agent: commit mesajı hazırla + push
```

```bash
# Mevcut branch'lerden en yüksek numarayı bul
git branch -a | grep -oP '\b[0-9]+(?=-)' | sort -n | tail -1

# Branch aç ve geç (örnek: son numara 4 ise)
git checkout -b 0005-feat/decisions-page

# Branch'te olduğunu doğrula
git branch --show-current  # → 0005-feat/decisions-page

# Çalışmayı yap, ardından:
git add <files>
git commit -m "feat(frontend): add Decisions page placeholder

- Create Decisions.tsx with empty-state placeholder UI
- Add /decisions route to App.tsx
- Add nav link to navbar"

git push origin 0005-feat/decisions-page
```

### Branch Kuralları

- **Asla** `master` branch'inde çalışma. Her task yeni bir branch ister.
- Master'da olunduğu fark edilirse: kullanıcıya sor, branch aç.
- Branch adı task ile ilgili olmalı, anlamsız isim olmaz.
- Branch işi bitince pushlanır, PR açılmaz (kullanıcı elle PR açar veya merge yapar).

---

## 3. Commit Mesajı Formatı

### Conventional Commits

```
<type>(<scope>): <kısa-özet>

- <detay-1>
- <detay-2>
- <detay-3>
```

### Type'lar

| Type | Anlamı |
|------|--------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltmesi |
| `refactor` | Kod iyileştirme, davranış değişmez |
| `docs` | Dokümantasyon değişikliği |
| `chore` | Tool/config/bağımlılık |
| `style` | Formatlama, noktalı virgül (anlamsız değişiklik) |
| `perf` | Performans iyileştirmesi |

### Scope'lar

| Scope | Anlamı |
|-------|--------|
| `frontend` | portfolio-agent-frontend |
| `backend` | portfolio-agent-backend |
| `api` | apps/api içi |
| `worker` | apps/worker içi |
| `db` | packages/db (schema, migration, seed) |
| `shared` | packages/shared |
| `signal-engine` | packages/signal-engine |
| `agent-core` | packages/agent-core |
| `market-data` | packages/market-data |
| `notifications` | packages/notifications |
| `docs` | docs/ klasörü |
| `deps` | Bağımlılık değişikliği |
| `infra` | Docker, CI, config |
| `skill` | opencode skill'leri |

### Örnek Commit Mesajları

```
feat(frontend): add Decisions page with placeholder UI

- Create Decisions.tsx under pages/Decisions/
- Add /decisions route to router
- Add Decisions link to navbar
- Include skeleton for risk profile, goals, strategy configs
```

```
refactor(backend): extract service layer from chat routes

- Move business logic to ChatService class
- Inject dependencies via constructor
- Routes now only handle HTTP transport
- Add unit test for ChatService
```

```
fix(worker): prevent duplicate signal on restart

- Add idempotency key check before signal creation
- Use job_runs table to track processed candles
- Skip already-processed candle close times
```

---

## 4. Çalışma Akışı

### Başlangıç (yeni task)

```
1. git status                  ← mevcut durumu kontrol et
2. git log --oneline -5        ← son commit'leri göster
3. git branch --show-current   ← hangi branch'teyim?
4. Eğer master'daysa → kullanıcıya sor: "Yeni branch açıyorum, onaylıyor musun?"
5. git checkout -b <branch>    ← branch aç
6. git branch --show-current   ← doğrula
```

### Çalışma sırasında

```
1. Her dosya kaydı sonrası git status kontrol
2. Sadece ilgili dosyaları git add
3. Asla git add . yapma — ne eklediğini bil
4. .env, node_modules, dist gibi dosyaları asla ekleme
```

### Push öncesi

```
1. git status                  ← son durum
2. git diff --cached           ← ne commitlenecek?
3. Kullanıcıya özet göster: "Şu dosyaları değiştirdim:
   - frontend/src/pages/Decisions.tsx (yeni)
   - frontend/src/App.tsx (güncellendi)
   Commit mesajım: feat(frontend): add Decisions page
   Pushlamamı onaylıyor musun?"
4. Kullanıcı "Evet" derse:
   git add <dosyalar>
   git commit -m "..."
   git pull --rebase origin master  ← çakışma kontrolü
   git push origin <branch>
```

### Merge / PR sonrası

```
Kullanıcı elle veya GitHub üzerinden branch'i master'a merge eder.
Agent asla master'a direkt push veya merge yapmaz.
```

---

## 5. Yasak / Kısıtlı İşlemler

| İşlem | Durum |
|-------|-------|
| `git push origin master` | **YASAK** — direkt master'a push asla yapılmaz |
| `git merge` | **Kullanıcı onayı zorunlu** |
| `git rebase` | **Kullanıcı onayı zorunlu** — history rewrite riski |
| `git reset --hard` | **Kullanıcı onayı zorunlu** — veri kaybı riski |
| `git checkout -b` | Task başında otomatik, ama kullanıcıya bildir |
| `git branch -D` | **Kullanıcı onayı zorunlu** |
| `git add .` | **Kullanıcıya sor** — hangi dosyaların ekleneceğini listele |
| `git commit --amend` | Sadece son commit pushlanmamışsa, kullanıcıya sor |
| `git push --force` | **YASAK** — force push history'i bozar |
| `git rm` | **Kullanıcıya sor** — dosya silme işlemi |

---

## 6. Commit Öncesi Otomatik Kontroller

Her commit öncesi agent şunları kontrol eder:

```bash
# 1. TypeCheck
cd portfolio-agent-backend && bun run typecheck  # backend için
cd portfolio-agent-frontend && npm run typecheck  # frontend için

# 2. .env dosyası eklenmiyor mu?
git diff --cached --name-only | grep -q ".env" && echo "UYARI: .env ekleniyor!"

# 3. Sadece ilgili dosyalar ekleniyor mu?
# node_modules, dist, .env, *.log asla eklenmez
```

TypeCheck başarısızsa commit yapılmaz, önce hata düzeltilir.

---

## 7. Kullanıcıya Sorma Şablonu

```
📦 Mevcut Durum:
Branch: 0005-feat/decisions-page
Son commit: 22a00b9 feat: implement technical indicators

📝 Değişiklikler:
  M portfolio-agent-frontend/src/App.tsx
  A portfolio-agent-frontend/src/pages/Decisions.tsx

💬 Commit Mesajı:
feat(frontend): add Decisions page with placeholder UI

- Create Decisions.tsx under pages/
- Add /decisions route to App.tsx
- Add Decisions nav link

Bu branch'i (0005-feat/decisions-page) pushlamamı onaylıyor musun? (Evet/Hayır)
```

### Push Öncesi Soru Şablonu

Push'tan önce her zaman kullanıcıya şu bilgileri göster ve onay al:

```
📦 Mevcut Durum:
Branch: 0005-feat/decisions-page
Son commit: 22a00b9 feat: implement technical indicators

Bu branch'i pushlamamı onaylıyor musun? (Evet / Hayır)
```

Eğer branch'te tek task varsa direkt push. Birden fazla task varsa uyarı göster:

```
⚠️ Bu branch'te [N] task bulunuyor (kural: 1 branch = 1 task).
Yine de pushlayalım mı, yoksa son task'ı ayırıp yeni branch mi açalım?
```

### Yeni Task Başlangıcı

Her yeni task'ta kullanıcıya sor:

```
🔄 Yeni task: [task adı]
Şu an [branch-adi] branch'indesin.
Bu branch'te zaten [N] task var.
Yeni branch açalım mı? (Evet / Hayır, bu branch'te devam)
```

- Kullanıcı "Evet" derse → yeni branch numarası bul, checkout -b yap
- Kullanıcı "Hayır" derse → mevcut branch'te devam et (ama uyarı notu düş)

---

## 8. Acil Durumlar

- **Conflict varsa:** push yapma, kullanıcıya "X dosyasında conflict var, çözüm için yardım ister misin?" de.
- **Wrong branch:** "Şu anda master branch'indesin. feat/decisions-page branch'ine geçeyim mi?"
- **Uncommitted changes:** Başka bir task'a geçmeden önce "Kaydedilmemiş değişiklikler var. Ne yapalım? (commit/stash/discard)"
