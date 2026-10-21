#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "BIBLIA Bibel-App. Iteration 4: zoomabhängige Kollisionserkennung für Kartenmarker/Beschriftungen/Symbole mit sanfter Neupositionierung, Mindestabständen, unveränderten Ankern und Verbindungslinien."
frontend:
  - task: "Map collision layout (Übersicht + Studienreise)"
    implemented: true
    working: "NA"
    file: "src/lib/mapLayout.ts, src/components/AnchoredMarker.tsx, src/components/GeoMap.tsx, src/components/JourneyLayer.tsx, src/components/ZoomableMap.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented solver + animated anchored markers with leader lines; zoom bucket context in ZoomableMap."
  - task: "Bible features E2E (highlight, comment, link, custom unit)"
    implemented: true
    working: "NA"
    file: "app/(tabs)/bible.tsx, app/unit/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Needs full E2E verification."
agent_communication:
  - agent: "main"
    message: "Test map collision layout and bible features E2E."
  - task: "Imported HTML studies as playable worlds + intro animation"
    implemented: true
    working: "NA"
    file: "src/data/campaigns/*.json, src/data/john.ts, app/world/[id].tsx, src/components/CampaignMap.tsx, src/components/ReadingVerses.tsx, src/components/IntroAnimation.tsx, app/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "5 HTML studies converted to 12 campaigns (Tora x5, Matthäus/Markus/Lukas, Gleichnisse, Propheten, Apg, Briefe). Intro animation ~10s with skip."
  - task: "Iteration 6: translation manager (ELB 2006 prepared), lexicon/infotafeln/timeline, 6 new lessons, avatar editor + integration"
    implemented: true
    working: "NA"
    file: "src/data/bible.ts, backend/server.py, src/data/lexicon.ts, src/data/lessonsExtra.ts, src/components/InfoSheet.tsx, app/timeline.tsx, app/avatar.tsx, src/components/AvatarView.tsx, src/lib/avatar.ts, src/components/StationExtras.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Schema v4 with avatar; migration tested via tsx."
  - task: "Iteration 7: Studienbereich (Leseposition, Lesefortschritt, Lesepläne, Kommentare, Querverweise, Sammlung, Merkliste, Journal)"
    implemented: true
    working: "NA"
    file: "src/lib/study.ts, app/study/*, src/components/VerseStudy.tsx, app/(tabs)/bible.tsx, backend/server.py (/api/study/*)"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Schema v5 (study). Plan engine unit-checked via tsx (leap year 366 days, redistribute/shift)."
  - task: "Iteration 8: Karten-Layout in allen Lernwelten (Vollflächen-Karte, Startausschnitt, Label-Kollisionen/Gruppen, Infotafel/Legende, Vollbild)"
    implemented: true
    working: "NA"
    file: "src/components/ZoomableMap.tsx, src/components/GeoMap.tsx, src/components/MapPlaceMarker.tsx, src/components/MapPanel.tsx, src/components/MapLegend.tsx, src/lib/mapLayout.ts (solveLabels), app/world/[id].tsx, app/(tabs)/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "cover-fit statt contain, fitBox/reset/fit-all, keepVisible bei Panel, Marker fix an Koordinaten, Labels mit 16 Slots + Leader-Linie, Gruppen +n, Ausblenden nachrangiger Labels, Ortsliste."
  - task: "Iteration 10: Deutscher gemeinfreier Kommentar Calvin (calvin-de) im Versstudium"
    implemented: true
    working: "NA"
    file: "backend/data/commentaries/calvin_de.json, backend/data/sources.json, src/components/VerseStudy.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "2972 Abschnitte (Jos, Joh, Apg, Röm, Gal, Eph, Phil, Tit, Phlm, Hebr, Jak, 1/2Petr, 1Joh, Jud) aus GermanSwordModules deuCalvinKommentare (Gemeinfrei). Deutsch zuerst sortiert, lange Texte einklappbar."

  - task: "Iteration 12: Bibliothek – Meine Einträge (Bibel/Studienreise sortiert, farbig), Favoriten Bibel (Buch/Kapitel/Vers), Favoriten Studienreise (Herz in Lektion + Karten-Panel), Bilder (Kamera/Upload, lokal, Zuordnung Bibelstelle/Lektion, Titel+Notiz)"
    implemented: true
    working: "NA"
    file: "app/(tabs)/library.tsx, src/components/PhotoAdd.tsx, src/components/FavHeart.tsx, src/components/LessonActions.tsx, src/lib/libraryIndex.ts, src/lib/photos.ts, src/lib/progress-logic.ts (schema v6), src/lib/store.tsx, app/(tabs)/bible.tsx, app/station/[id].tsx, app/world/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
  - task: "Iteration 13: Lexikon Etappe 1"
    implemented: true
    working: "NA"
    file: "app/lexicon/index.tsx, app/lexicon/[id].tsx, src/data/articles.ts, src/data/articleTypes.ts, src/data/lexiconPlan.ts, src/components/RefLinks.tsx, src/components/ArticleMap.tsx, app/(tabs)/bible.tsx, src/components/InfoSheet.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
  - task: "Iteration 14: Lexikon Etappe 2 (Tora, 41 neue Artikel) + KI-Personenillustrationen (GPT Image 1, 12 Bilder gebündelt)"
    implemented: true
    working: "NA"
    file: "src/data/articlesTora1.ts, src/data/articlesTora2.ts, src/data/articleSources.ts, src/data/illustrations.ts, assets/images/lexicon/*.jpg, src/data/articles.ts, src/data/articleTypes.ts (placeId), app/lexicon/[id].tsx, app/lexicon/index.tsx, src/components/ArticleMap.tsx, backend/scripts/gen_illustrations.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
  - task: "Iteration 16: Lexikon Etappe 3 (Josua–2. Könige, 31 Artikel, 15 neue KI-Bilder) + Bibliothek als Bücherregal"
    implemented: true
    working: "NA"
    file: "src/data/articlesKings1.ts, src/data/articlesKings2.ts, src/data/illustrations.ts, src/components/Bookshelf.tsx, app/(tabs)/library.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
