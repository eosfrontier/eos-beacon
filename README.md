# [BEACON] - Eos Broadcasting Service #

![Orbit logo](https://github.com/goblinbot/eos-beacon/blob/master/public/images/orbit.png?raw=true)

**THE** interfactional service for displaying & propagating information to the entire base, colony or ship.

*Eos-Beacon is a Node JS application used in the Dutch sci-fi larp Eos Frontier.
Realised by: Thijs Boerma, and tweaked with help from several players and gamemasters. Special shout-outs to Arius, Mai, Rabochiy and SLmar.*

*eos-beacon was originaly written as a brainfart written by a bored webdesigner, and thus contains many amateur mistakes. Feel very free to leave comments or ideas! Writing Beacon has been one of the best learning experiences I could have wished for.*

<!-- **HET MAKEN VAN EEN CUSTOM BROADCAST**
De broadcasts (ALERTS) bestaan uit drie onderdelen:

- De HTML pagina => In de /public/broadcasts/ folder.
  Dit is de pagina die zal verschijnen als alert, en alles wat hiermee word genomen. Bijvoorbeeld geluid, of filmpjes.

- **CSS: Dit is in release MiddleManagementDino herschreven, mail me als je dit wilt weten voordat ik het heb kunnen uitschrijven!**

- Het javascript object => Gedefineerd in /public/broadcasts.js
  Dit bevat alle gegevens om een alert/broadcasts op te roepen.

**Het BROADCAST object:**
Bestaat uit zes waardes. Als voorbeeld kijken we naar **3** voorgekauwde broadcasts:

- var defaultBroadcast  = new broadcastObj("Broadcast Initialise","standby",1,"0","0");
- var broadCastPortalIncoming = new broadcastObj("Portal Incoming","portalincoming",3,"30000","0");
- var broadCastEnemyContact = new broadcastObj("Enemy Contact","enemycontact",8,"0","attack");

Deze staan gedefineerd in **broadcasts.js** in de public folder, en hier zijn toevoegingen makkelijk mogelijk.

Een **broadcastObj** is op de volgende manier opgebouwd:

*var UNIEKENAAM = new broadcastObj(title, file, priority, duration, colorscheme)*

**VAR UNIEKENAAM** => Een unieke naam om de broadcast mee aan te roepen.

**title => de titel**, een korte omschrijving het liefst.

**file  => de naam van het HTML bestand** dat moet worden ingeladen. (Bijvoorbeeld: default . HTML word automatisch erachter aan toegevoegd.)

**colorscheme => het kleurenschema(CSS opmaak)** dat moet worden ingeladen.
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


# Aanroepen van BROADCASTS:

Broadcasts worden naar alle verbonden clients verstuurd via de functie **sendBroadCast(NAAM)** (Case Sensitive).

**(NAAM)** is de **VAR UNIEKENAAM** die we hebben gedefineerd in broadcasts.js, zoals bijvoorbeeld, de broadcast 'broadCastEnemyContact'.
Deze roepen we dus aan met:

**sendBroadCast(broadCastEnemyContact);**
Deze functie kunnen we binden aan HTML knoppen/links _( onclick="sendBroadCast(broadCastEnemyContact);" )_ of we typen dit direct in **console** van je browser. Deze is in de meeste browsers te bereiken door op de pagina te rechtklikken (element inspecteren) of F12.

De meeste broadcasts staan in /public/adm/adminPanel.html (de achter inlog verstopte backend) in de vorm van buttons, met daarop onclick de functies.
voorbeeld: *onclick="sendBroadCast(resetBroadcast); cpanelStatus('Broadcasts CLEARED');"* -->
