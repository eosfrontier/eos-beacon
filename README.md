# [BEACON] - Eos Broadcasting Service

**DE** interfactionele service voor het displayen & updaten van informatie voor de hele kolonie.

*Dit is een kleine JS applicatie bedoelt voor sci-fi larp Eos.
Door: Thijs Boerma (IC: Maati Infor Danam)*

# online mirror
https://eos-beacon.herokuapps.com/

# Onderdelen
[BEACON] is afhankelijk van verschillende externe plugins/frameworks/luiheden, die hieronder staan gelijst.

**NODE.JS**
PLUGINS ( Installeren via NPM ):
  - Socket.io
  - express
  - mysql ( nog ongebruikt )
  - border-parser
  - ip

**JAVASCRIPT**
  - jQuery

**OPMAAK (CSS/SCSS)**
  - Bootstrap 3.3+
  - Een SCSS compiler (bij schrijven/bijwerken)

**DATABASE**
  - MySQL : al word momenteel nog niks gedaan met een database.


# Alert/Broadcast/Notificaties uitleg:
Broadcasts bestaan uit verschillende waardes.
bijvoorbeeld:

var broadcastTest = {
  title:"Broadcast Test",
  file:"testBroadcast",
  priority:"1",
  duration:"0",
  colorscheme:"0"
};

  **'title' => De titel** van de broadcast/notificatie/alert. Een korte omschrijving, het liefst.

  **'file' => De naam van het HTML bestand** dat bij de broadcast word ingeladen. Hier word automatisch .html achter gezet.

  **'colorscheme' => Het kleurenschema** dat word aangeroepen bij de broadcast.
  - Als deze **0** is, dan pakt hij gewoon de default kleuren of reset hij naar default.
  - Als deze **PREV** is, dan houdt hij de vorige kleuren aan en reset hij niet.
  - Al voer je een andere waarde in, bijvoorbeeld, *PORTAL* dan probeerd hij het CSS bestand colors-*PORTAL*.css in te laden.

  **'priority' => De "Prioriteit"** van de broadcast (1 tot en met 10). Hogere broadcasts kunnen lagere overschrijven:
  zo kan belangrijker nieuws als "we worden aangevallen" getoond worden en niet overschreven worden door "Jantje pietje heeft Post".

  **'duration' => De duratie (in miliseconden)**. Hoe lang de notificatie actief blijft staan.
  Bij **0** blijft de notificatie staan tot overschreven/ALL CLEAR word gegeven.
  **vuistregels:**
  - 0 = oneindig
  - 1000 = 1 seconde
  - 60000 = 1 minuut
  - 360000 = 1 uur
