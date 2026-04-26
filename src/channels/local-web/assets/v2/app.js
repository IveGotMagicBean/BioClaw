// Fetch runtime config from server, then boot the app.
(async function boot() {
  var cfg = {};
  try {
    var r = await fetch('/api/config');
    cfg = await r.json();
  } catch (e) { console.warn('Failed to load /api/config, using defaults', e); }

  var chatJid = cfg.chatJid || 'local-web@local.web';
  var assistantName = cfg.assistantName || 'Bioclaw';
  var AUTH_TOKEN = cfg.authToken || '';
  var STREAM_QS = cfg.streamQs || '';
  var THREAD_KEY = 'bioclaw-web-thread-jid';
  var THEME_KEY = 'bioclaw-theme';
  var PALETTE_KEY = 'bioclaw-palette';
  var SIDEBAR_KEY = 'bioclaw-sidebar-collapsed';
  var COMPOSER_HEIGHT_KEY = 'bioclaw-composer-height';
  var MAIN_SPLIT_KEY = 'bioclaw-main-left-size-v2';
  var THREAD_SPLIT_KEY = 'bioclaw-thread-rail-width-v2';
  var TRACE_SPLIT_KEY = 'bioclaw-trace-sidebar-width-v2';
  // One-time cleanup of pre-redesign stored sizes (could squeeze the new layout)
  try {
    ['bioclaw-main-left-size', 'bioclaw-thread-rail-width', 'bioclaw-trace-sidebar-width', 'bioclaw-composer-height']
      .forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) {}
  var threads = [];

  // Set session JID in settings drawer
  var jidEl = document.getElementById('sessionJid');
  if (jidEl) jidEl.textContent = chatJid;

const LANG_KEY = 'bioclaw-web-lang';
const THEMES = ['default', 'ocean', 'sakura', 'cream', 'mono-light', 'midnight', 'slate', 'forest', 'wine'];

    const unifiedRoot = document.getElementById('unifiedRoot');
    const unifiedLayout = document.getElementById('unifiedLayout');
    const tabTraceBtn = document.getElementById('tabTraceBtn');   // may be null (removed)
    const tabChatBtn = document.getElementById('tabChatBtn');     // may be null (removed)
    const panelTrace = document.getElementById('panelTrace');     // now a drawer
    const panelChat = document.getElementById('panelChat');
    const openTraceBtn = document.getElementById('openTraceBtn');
    const closeTraceBtn = document.getElementById('closeTrace');
    const mainPanelResizer = document.getElementById('mainPanelResizer');
    const chatShell = document.querySelector('.chat-shell');
    const threadRail = document.querySelector('.thread-rail');
    const threadRailResizer = document.getElementById('threadRailResizer');
    const threadListEl = document.getElementById('threadList');
    const newThreadBtn = document.getElementById('newThreadBtn');
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('composer');
    const input = document.getElementById('text');
    const composerResizer = document.getElementById('composerResizer');
    const fileInput = document.getElementById('file');
    const fileNameEl = document.getElementById('filename');
    const sendBtn = document.getElementById('send');
    const statusEl = document.getElementById('status');
    const connDot = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');
    const connPill = document.getElementById('connPill');
    const traceConnDot = document.getElementById('traceConnDot');
    const traceConnLabel = document.getElementById('traceConnLabel');
    const traceConnPill = document.getElementById('traceConnPill');
    const themeGrid = document.getElementById('themeGrid');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const chatShellEl = document.getElementById('chatShell');
    const workStrip = document.getElementById('workStrip');
    const workStripLabel = document.getElementById('workStripLabel');
    const workStripDetail = document.getElementById('workStripDetail');
    const workStripTime = document.getElementById('workStripTime');
    const chatHero = document.getElementById('chatHero');
    const langBtn = document.getElementById('langBtn');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const settingsDrawer = document.getElementById('settingsDrawer');
    const openSettingsBtn = document.getElementById('openSettings');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const settingsConnValue = document.getElementById('settingsConnValue');
    const settingsTraceConnValue = document.getElementById('settingsTraceConnValue');
    const manageRefreshBtn = document.getElementById('manageRefreshBtn');
    const manageCommandInput = document.getElementById('manageCommandInput');
    const manageCommandBtn = document.getElementById('manageCommandBtn');
    const manageCommandOutput = document.getElementById('manageCommandOutput');
    const manageStatusPanel = document.getElementById('manageStatusPanel');
    const manageDoctorPanel = document.getElementById('manageDoctorPanel');

    const traceMain = document.querySelector('.trace-main');
    const timeline = document.getElementById('timeline');
    const traceSidebar = document.querySelector('.trace-sidebar');
    const traceSidebarResizer = document.getElementById('traceSidebarResizer');
    const groupSel = document.getElementById('group');
    const treeEl = document.getElementById('tree');
    const traceStreamCb = document.getElementById('traceShowStream');

    // Default: hide raw stream chunks (they're noisy; the consolidated message is enough).
    // Force-clear any previously-saved 'true' state so users with old localStorage start clean.
    var traceShowStream = false;
    try { localStorage.setItem('bioclaw-trace-stream', '0'); } catch (e) {}

    let lastSignature = '';
    let pollTimer = null;
    let chatEs = null;
    let lastConnMode = null;
    let traceEs = null;
    let traceBooted = false;
    var lang = 'zh';
    var currentTab = 'chat';

    var I18N = {
      zh: {
        pageTitle: 'BioClaw',
        tabChat: '对话',
        tabTrace: '实验追踪',
        connPillTitle: '新消息',
        connConnecting: '连接中…',
        tracePillTitle: '实验追踪',
        traceIdle: '未连接',
        settingsTitle: '设置',
        settingsAria: '打开设置',
        closeSettingsAria: '关闭',
        threadsTitle: '对话',
        threadsHint: '每个对话独立保存记忆与历史。',
        newThread: '新对话',
        newThreadPrompt: '输入新对话标题（可留空）',
        threadUntitled: '新对话',
        threadEmpty: '还没有其他对话。点击右上角创建一个新的独立线程。',
        secDisplay: '显示',
        secConnection: '连接',
        secControl: '控制台',
        lblLang: '界面语言',
        lblTheme: '外观',
        lblConn: '对话列表',
        lblTraceConn: '追踪列表',
        lblSession: '会话 ID',
        lblControlCommand: '控制命令',
        lblStatusPanel: '状态',
        lblDoctorPanel: '诊断',
        langToggle: 'English',
        themeLight: '浅色主题',
        themeDark: '深色主题',
        themeSwitchToLight: '切换到浅色主题',
        themeSwitchToDark: '切换到深色主题',
        resizeInputAria: '调整输入框高度',
        resizeInputTitle: '拖动这里调整输入框高度，双击恢复默认高度',
        resizePanelsAria: '调整左右主栏宽度',
        resizePanelsTitle: '拖动这里调整实验追踪和对话区域的宽度',
        resizeThreadsAria: '调整对话列表宽度',
        resizeThreadsTitle: '拖动这里调整左侧对话列表宽度',
        resizeTraceAria: '调整追踪侧栏宽度',
        resizeTraceTitle: '拖动这里调整实验追踪右侧栏宽度',
        manageRefresh: '刷新',
        manageRunCommand: '执行',
        manageCommandPlaceholder: '例如：/status 或 /workspace list',
        manageEmpty: '暂无数据。',
        manageLoading: '加载中…',
        manageCommandError: '命令执行失败',
        manageFetchError: '加载失败',
        threadCreateFail: '创建对话失败',
        threadRenamePrompt: '输入新的对话标题',
        threadRenameFail: '重命名对话失败',
        threadArchiveConfirm: '确认归档这个对话？',
        threadArchiveFail: '归档对话失败',
        threadRenameAction: '重命名',
        threadArchiveAction: '归档',
        chatTitle: '对话',
        chatHintTpl: 'Enter 发送 · Shift+Enter 换行 · 默认无需 @{name}',
        traceSub: 'Agent 每次运行按思考链分组展示。默认隐藏流式输出片段；勾选下方可显示全部（适合调试）。',
        groupLabel: '群组',
        allGroups: '全部',
        reloadTrace: '刷新',
        traceStreamLabel: '显示流式片段（调试）',
        evtRunStart: '开始处理',
        evtRunEnd: '运行结束',
        evtRunError: '运行异常',
        evtStream: '模型输出片段',
        evtContainer: '容器启动',
        evtIpc: '跨群发送',
        evtThinking: '思考',
        evtToolUse: '工具调用',
        evtUnknown: '事件',
        traceMsgCount: '待处理消息',
        tracePromptLen: '提示长度',
        traceOutChars: '本段输出字符',
        traceSession: '会话 ID',
        traceContainer: '容器名',
        traceIpcKind: '类型',
        traceRawJson: '原始 JSON',
        placeholder: '例如：用 BioPython 读取 FASTA 并统计 GC 含量…',
        uploadHint: '上传文件会写入群组工作区，Agent 可通过路径访问。',
        uploadLabel: '上传文件',
        noFile: '未选择',
        send: '发送',
        sseLive: '实时更新',
        poll2s: '约 2 秒刷新',
        offline: '离线',
        sseWait: '连接中…',
        sseOk: '已连接',
        sseBad: '已断开',
        roleAssistant: '助手',
        roleYou: '你',
        userFallback: '用户',
        uploadedPrefix: '已上传 · ',
        openFile: '打开',
        download: '下载',
        copy: '复制',
        copied: '已复制',
        copyFail: '复制失败',
        downloadFile: '下载文件',
        uploading: '正在上传…',
        uploadFail: '上传失败',
        sendFail: '发送失败',
        sidebarTitle: '工作区树',
        sidebarHint: '选择上方群组后加载 groups/&lt;folder&gt;',
        treePick: '请选择群组',
        treeEmpty: '（空）',
        loadFail: '加载失败',
        lblPalette: '配色',
        themeLightShort: '浅色',
        themeDarkShort: '深色',
        sidebarToggleAria: '折叠 / 展开侧栏',
        welcomeTitle: '欢迎使用 BioClaw',
        welcomeSub: 'AI 生物研究助手 · 直接用自然语言描述你想做的分析',
        suggestFastaTitle: 'FASTA · GC 含量',
        suggestFastaDesc: '读取 FASTA 文件并计算 GC 含量',
        suggestBlastTitle: '序列搜索',
        suggestBlastDesc: 'BLAST 一段未知序列定位物种',
        suggestDataTitle: '数据可视化',
        suggestDataDesc: '读 CSV 生成 volcano plot',
        suggestPubmedTitle: '文献速查',
        suggestPubmedDesc: '近期 CRISPR off-target 相关论文',
        workThinking: '正在思考',
        workRunning: '正在执行',
        workDone: '已完成',
        workError: '运行异常',
        viewTrace: '查看思考过程',
        thoughtsDone: '查看思考过程',
        traceDrawerTitle: '实验追踪',
        traceDrawerAria: '实验追踪面板',
      },
      en: {
        pageTitle: 'BioClaw',
        tabChat: 'Chat',
        tabTrace: 'Lab trace',
        connPillTitle: 'Messages',
        connConnecting: 'Connecting…',
        tracePillTitle: 'Trace',
        traceIdle: 'Idle',
        settingsTitle: 'Settings',
        settingsAria: 'Open settings',
        closeSettingsAria: 'Close',
        threadsTitle: 'Threads',
        threadsHint: 'Each thread keeps its own memory and history.',
        newThread: 'New chat',
        newThreadPrompt: 'Enter a title for the new chat (optional)',
        threadUntitled: 'New chat',
        threadEmpty: 'No extra chats yet. Create a new independent thread from the button above.',
        secDisplay: 'Display',
        secConnection: 'Connection',
        secControl: 'Control',
        lblLang: 'Language',
        lblTheme: 'Appearance',
        lblConn: 'Chat list',
        lblTraceConn: 'Trace feed',
        lblSession: 'Session ID',
        lblControlCommand: 'Control command',
        lblStatusPanel: 'Status',
        lblDoctorPanel: 'Doctor',
        langToggle: '中文',
        themeLight: 'Light theme',
        themeDark: 'Dark theme',
        themeSwitchToLight: 'Switch to light theme',
        themeSwitchToDark: 'Switch to dark theme',
        resizeInputAria: 'Resize composer',
        resizeInputTitle: 'Drag to resize the composer. Double-click to reset.',
        resizePanelsAria: 'Resize main panels',
        resizePanelsTitle: 'Drag to resize the trace and chat columns.',
        resizeThreadsAria: 'Resize thread list',
        resizeThreadsTitle: 'Drag to resize the thread list column.',
        resizeTraceAria: 'Resize trace sidebar',
        resizeTraceTitle: 'Drag to resize the trace sidebar.',
        manageRefresh: 'Refresh',
        manageRunCommand: 'Run',
        manageCommandPlaceholder: 'For example: /status or /workspace list',
        manageEmpty: 'No data yet.',
        manageLoading: 'Loading…',
        manageCommandError: 'Command failed',
        manageFetchError: 'Load failed',
        threadCreateFail: 'Failed to create thread',
        threadRenamePrompt: 'Enter a new title',
        threadRenameFail: 'Failed to rename thread',
        threadArchiveConfirm: 'Archive this thread?',
        threadArchiveFail: 'Failed to archive thread',
        threadRenameAction: 'Rename',
        threadArchiveAction: 'Archive',
        chatTitle: 'Chat',
        chatHintTpl: 'Enter to send · Shift+Enter for newline · @{name} optional by default',
        traceSub: 'Each agent run is grouped as a thinking chain. Stream output chunks are hidden by default; enable below for debugging.',
        groupLabel: 'Group',
        allGroups: 'All',
        reloadTrace: 'Refresh',
        traceStreamLabel: 'Show stream chunks (debug)',
        evtRunStart: 'Run started',
        evtRunEnd: 'Run finished',
        evtRunError: 'Run failed',
        evtStream: 'Model output chunk',
        evtContainer: 'Container started',
        evtIpc: 'IPC send',
        evtThinking: 'Thinking',
        evtToolUse: 'Tool call',
        evtUnknown: 'Event',
        traceMsgCount: 'Messages batched',
        tracePromptLen: 'Prompt length',
        traceOutChars: 'Chunk chars',
        traceSession: 'Session',
        traceContainer: 'Container',
        traceIpcKind: 'Kind',
        traceRawJson: 'Raw JSON',
        placeholder: 'e.g. Read a FASTA with BioPython and report GC content…',
        uploadHint: 'Uploads go to the group workspace; the agent can read them by path.',
        uploadLabel: 'Upload file',
        noFile: 'No file chosen',
        send: 'Send',
        sseLive: 'Live',
        poll2s: '~2s refresh',
        offline: 'Offline',
        sseWait: 'Connecting…',
        sseOk: 'Connected',
        sseBad: 'Disconnected',
        roleAssistant: 'Assistant',
        roleYou: 'You',
        userFallback: 'User',
        uploadedPrefix: 'Uploaded · ',
        openFile: 'Open',
        download: 'Download',
        copy: 'Copy',
        copied: 'Copied',
        copyFail: 'Copy failed',
        downloadFile: 'Download file',
        uploading: 'Uploading…',
        uploadFail: 'Upload failed',
        sendFail: 'Send failed',
        sidebarTitle: 'Workspace tree',
        sidebarHint: 'Pick a group above to load groups/&lt;folder&gt;',
        treePick: 'Select a group',
        treeEmpty: '(empty)',
        loadFail: 'Load failed',
        lblPalette: 'Palette',
        themeLightShort: 'Light',
        themeDarkShort: 'Dark',
        sidebarToggleAria: 'Toggle sidebar',
        welcomeTitle: 'Welcome to BioClaw',
        welcomeSub: 'AI bioinformatics assistant — describe what you want to analyze in plain language',
        suggestFastaTitle: 'FASTA · GC content',
        suggestFastaDesc: 'Read a FASTA file and compute GC content',
        suggestBlastTitle: 'Sequence search',
        suggestBlastDesc: 'BLAST an unknown sequence to identify species',
        suggestDataTitle: 'Data visualization',
        suggestDataDesc: 'Read a CSV and generate a volcano plot',
        suggestPubmedTitle: 'PubMed quickscan',
        suggestPubmedDesc: 'Recent CRISPR off-target papers',
        workThinking: 'Thinking',
        workRunning: 'Running',
        workDone: 'Done',
        workError: 'Run error',
        viewTrace: 'View thoughts',
        thoughtsDone: 'View thoughts',
        traceDrawerTitle: 'Lab trace',
        traceDrawerAria: 'Lab trace panel',
      },
    };

    function T() { return I18N[lang]; }

    function applyLang(next) {
      lang = next === 'en' ? 'en' : 'zh';
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      var t = T();
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      document.title = t.pageTitle;
      if (tabTraceBtn) tabTraceBtn.textContent = t.tabTrace;
      if (tabChatBtn) tabChatBtn.textContent = t.tabChat;
      connPill.title = t.connPillTitle;
      traceConnPill.title = t.tracePillTitle;
      document.getElementById('settingsHeading').textContent = t.settingsTitle;
      openSettingsBtn.setAttribute('aria-label', t.settingsAria);
      closeSettingsBtn.setAttribute('aria-label', t.closeSettingsAria);
      document.getElementById('threadsTitle').textContent = t.threadsTitle;
      document.getElementById('threadsHint').textContent = t.threadsHint;
      newThreadBtn.textContent = t.newThread;
      document.getElementById('secDisplay').textContent = t.secDisplay;
      document.getElementById('secConnection').textContent = t.secConnection;
      document.getElementById('secControl').textContent = t.secControl;
      document.getElementById('lblLang').textContent = t.lblLang;
      document.getElementById('lblTheme').textContent = t.lblTheme;
      document.getElementById('lblConn').textContent = t.lblConn;
      document.getElementById('lblTraceConn').textContent = t.lblTraceConn;
      document.getElementById('lblSession').textContent = t.lblSession;
      document.getElementById('lblControlCommand').textContent = t.lblControlCommand;
      document.getElementById('lblStatusPanel').textContent = t.lblStatusPanel;
      document.getElementById('lblDoctorPanel').textContent = t.lblDoctorPanel;
      langBtn.textContent = t.langToggle;
      var openTraceBtnLabelEl = document.getElementById('openTraceBtnLabel');
      if (openTraceBtnLabelEl) openTraceBtnLabelEl.textContent = (t.tabTrace || 'Lab trace');
      var traceDrawerTitleEl = document.getElementById('traceDrawerTitle');
      if (traceDrawerTitleEl) traceDrawerTitleEl.textContent = (t.tabTrace || 'Lab trace');
      var lblPaletteEl = document.getElementById('lblPalette');
      if (lblPaletteEl) lblPaletteEl.textContent = t.lblPalette;
      if (sidebarToggle) sidebarToggle.setAttribute('aria-label', t.sidebarToggleAria);
      var traceDrawerTitleEl = document.getElementById('traceDrawerTitle');
      if (traceDrawerTitleEl) traceDrawerTitleEl.textContent = t.traceDrawerTitle;
      manageRefreshBtn.textContent = t.manageRefresh;
      manageCommandBtn.textContent = t.manageRunCommand;
      manageCommandInput.placeholder = t.manageCommandPlaceholder;
      document.getElementById('chatTitle').textContent = t.chatTitle;
      document.getElementById('chatHint').textContent = t.chatHintTpl.replace('{name}', assistantName);
      document.getElementById('traceSub').textContent = t.traceSub;
      document.getElementById('i18n-group-label').textContent = t.groupLabel;
      document.getElementById('opt-all').textContent = t.allGroups;
      document.getElementById('reloadTrace').textContent = t.reloadTrace;
      document.getElementById('traceStreamLabel').textContent = t.traceStreamLabel;
      input.placeholder = t.placeholder;
      document.getElementById('uploadHint').textContent = t.uploadHint;
      document.getElementById('uploadLabel').textContent = t.uploadLabel;
      sendBtn.textContent = t.send;
      document.getElementById('i18n-sidebar-title').textContent = t.sidebarTitle;
      document.getElementById('i18n-sidebar-hint').innerHTML = t.sidebarHint;
      if (composerResizer) {
        composerResizer.setAttribute('aria-label', t.resizeInputAria);
        composerResizer.title = t.resizeInputTitle;
      }
      if (mainPanelResizer) {
        mainPanelResizer.setAttribute('aria-label', t.resizePanelsAria);
        mainPanelResizer.title = t.resizePanelsTitle;
      }
      if (threadRailResizer) {
        threadRailResizer.setAttribute('aria-label', t.resizeThreadsAria);
        threadRailResizer.title = t.resizeThreadsTitle;
      }
      if (traceSidebarResizer) {
        traceSidebarResizer.setAttribute('aria-label', t.resizeTraceAria);
        traceSidebarResizer.title = t.resizeTraceTitle;
      }
      var hasFile = fileInput.files && fileInput.files[0];
      fileNameEl.textContent = hasFile ? fileInput.files[0].name : t.noFile;
      if (!groupSel.value) treeEl.textContent = t.treePick;
      if (manageStatusPanel && !manageStatusPanel.textContent) manageStatusPanel.textContent = t.manageEmpty;
      if (manageDoctorPanel && !manageDoctorPanel.textContent) manageDoctorPanel.textContent = t.manageEmpty;
      syncThemeUi();
      renderThreads();
      if (lastConnMode === null) {
        connDot.classList.remove('live', 'poll');
        connLabel.textContent = t.connConnecting;
        settingsConnValue.textContent = t.connConnecting;
      } else setChatConn(lastConnMode);
      syncTracePillText();
    }

    function syncTracePillText() {
      if (traceEs) return;
      var t = T();
      traceConnLabel.textContent = t.traceIdle;
      settingsTraceConnValue.textContent = t.traceIdle;
    }

    (function initLang() {
      var saved = null;
      try {
        saved = localStorage.getItem(LANG_KEY) || localStorage.getItem('bioclaw-local-web-lang') || localStorage.getItem('bioclaw-dashboard-lang');
      } catch (e) {}
      applyLang(saved === 'en' ? 'en' : 'zh');
    })();

    function setChatConn(mode) {
      lastConnMode = mode;
      var t = T();
      connDot.classList.remove('live', 'poll');
      var label = t.offline;
      if (mode === 'sse') { connDot.classList.add('live'); label = t.sseLive; }
      else if (mode === 'poll') { connDot.classList.add('poll'); label = t.poll2s; }
      connLabel.textContent = label;
      settingsConnValue.textContent = label;
    }

    function stopTraceSse() {
      if (traceEs) { traceEs.close(); traceEs = null; }
      traceConnDot.classList.remove('live');
      traceConnPill.classList.remove('ok', 'bad');
      var t = T();
      traceConnLabel.textContent = t.traceIdle;
      settingsTraceConnValue.textContent = traceConnLabel.textContent;
    }

    function startTraceSse() {
      if (traceEs) return;
      var t = T();
      traceConnLabel.textContent = t.sseWait;
      settingsTraceConnValue.textContent = t.sseWait;
      traceConnPill.classList.remove('ok', 'bad');
      var url = '/api/trace/stream' + STREAM_QS;
      traceEs = new EventSource(url);
      traceEs.onopen = function () {
        traceConnLabel.textContent = T().sseOk;
        settingsTraceConnValue.textContent = traceConnLabel.textContent;
        traceConnDot.classList.add('live');
        traceConnPill.classList.add('ok');
        traceConnPill.classList.remove('bad');
      };
      traceEs.onmessage = function () {
        // Always update streaming bubble + work strip
        processTraceTick();
        // Only refresh trace timeline when the trace panel is visible
        if (traceBooted && !panelTrace.classList.contains('hidden-narrow')) {
          loadTrace(); loadTree();
        }
      };
      traceEs.onerror = function () {
        traceConnLabel.textContent = T().sseBad;
        settingsTraceConnValue.textContent = traceConnLabel.textContent;
        traceConnDot.classList.remove('live');
        traceConnPill.classList.add('bad');
        traceConnPill.classList.remove('ok');
      };
    }

    function authHeaders() {
      var h = {};
      if (AUTH_TOKEN) h['Authorization'] = 'Bearer ' + AUTH_TOKEN;
      return h;
    }

    function prettyJson(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return String(value);
      }
    }

    function formatManageStatus(status) {
      if (!status) return T().manageEmpty;
      var channels = Array.isArray(status.channels) ? status.channels : [];
      var tasks = Array.isArray(status.tasks) ? status.tasks : [];
      var lines = [
        'Chat: ' + (status.chatJid || 'unknown'),
        'Workspace: ' + (status.workspaceFolder || 'unbound'),
        'Agent: ' + (status.agentId || 'unbound') + (status.agentName ? ' (' + status.agentName + ')' : ''),
        'Provider: ' + (status.provider || 'unknown'),
        'Model: ' + (status.model || 'unknown'),
        'Memory: ' + (status.memoryConfigured ? 'configured' : 'empty'),
        'Channels: ' + (channels.length ? channels.map(function (channel) {
          return channel.name + '=' + (channel.connected ? 'up' : 'down');
        }).join(', ') : 'none'),
        'Tasks: ' + tasks.length,
      ];
      if (tasks.length) {
        lines.push('');
        lines.push('Scheduled tasks:');
        tasks.slice(0, 8).forEach(function (task) {
          lines.push('- ' + task.id + ' [' + task.status + ']' + (task.label ? ' ' + task.label : '') + (task.nextRun ? ' next=' + task.nextRun : ''));
        });
      }
      return lines.join('\n');
    }

    function formatManageDoctor(doctor) {
      if (!doctor) return T().manageEmpty;
      var checks = Array.isArray(doctor.checks) ? doctor.checks : [];
      var lines = [
        'Runtime: ' + (doctor.runtime || 'unknown'),
      ];
      if (!checks.length) return lines.join('\n');
      lines.push('');
      checks.forEach(function (check) {
        lines.push('- [' + check.status + '] ' + check.name + ': ' + check.detail);
      });
      return lines.join('\n');
    }

    async function refreshManagementPanels() {
      var t = T();
      if (manageStatusPanel) manageStatusPanel.textContent = t.manageLoading;
      if (manageDoctorPanel) manageDoctorPanel.textContent = t.manageLoading;
      try {
        var [statusRes, doctorRes] = await Promise.all([
          fetch('/api/manage/status?chatJid=' + encodeURIComponent(chatJid), { headers: authHeaders() }),
          fetch('/api/manage/doctor?chatJid=' + encodeURIComponent(chatJid), { headers: authHeaders() }),
        ]);
        if (!statusRes.ok || !doctorRes.ok) throw new Error(t.manageFetchError);
        var statusData = await statusRes.json();
        var doctorData = await doctorRes.json();
        if (manageStatusPanel) manageStatusPanel.textContent = formatManageStatus(statusData.status);
        if (manageDoctorPanel) manageDoctorPanel.textContent = formatManageDoctor(doctorData.doctor);
      } catch (e) {
        var message = e && e.message ? e.message : t.manageFetchError;
        if (manageStatusPanel) manageStatusPanel.textContent = message;
        if (manageDoctorPanel) manageDoctorPanel.textContent = message;
      }
    }

    async function runManageCommand(text) {
      var t = T();
      if (!text) return;
      if (manageCommandBtn) manageCommandBtn.disabled = true;
      if (manageCommandOutput) manageCommandOutput.textContent = t.manageLoading;
      try {
        var res = await fetch('/api/manage/command', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify({ chatJid: chatJid, text: text }),
        });
        if (!res.ok) throw new Error(t.manageCommandError);
        var data = await res.json();
        if (manageCommandOutput) {
          manageCommandOutput.textContent = data.response || prettyJson(data.data) || t.manageEmpty;
        }
        await refreshManagementPanels();
      } catch (e) {
        if (manageCommandOutput) {
          manageCommandOutput.textContent = e && e.message ? e.message : t.manageCommandError;
        }
      } finally {
        if (manageCommandBtn) manageCommandBtn.disabled = false;
      }
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function escAttr(s) {
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }

    (function setupMarkdownSanitize() {
      if (typeof DOMPurify !== 'undefined' && !globalThis.__bioclawDpHook) {
        globalThis.__bioclawDpHook = true;
        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
          if (node.tagName === 'A' && node.hasAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noreferrer noopener');
          }
        });
      }
    })();

    function linkifyBareFilePaths(t) {
      return String(t).replace(/(^|\s|[>\u00a0])(\/files\/[\w./%-]+)/g, function (_, sep, p) {
        return sep + '[' + p + '](' + p + ')';
      });
    }

    function markdownToSafeHtml(raw) {
      if (typeof marked === 'undefined' || typeof marked.parse !== 'function' || typeof DOMPurify === 'undefined') {
        return esc(raw).replace(/(\/files\/[\w./%-]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>').replace(/\n/g, '<br>');
      }
      try {
        if (typeof marked.setOptions === 'function') marked.setOptions({ gfm: true, breaks: true });
        var linked = linkifyBareFilePaths(raw);
        var html = marked.parse(linked, { async: false });
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','b','i','code','pre','ul','ol','li','h1','h2','h3','h4','h5','h6','blockquote','a','hr','del','ins','sub','sup','table','thead','tbody','tr','th','td','img'],
          ALLOWED_ATTR: ['href','title','class','colspan','rowspan','align','src','alt','width','height','loading'],
          ALLOW_DATA_ATTR: false,
        });
      } catch (e2) {
        return esc(raw).replace(/\n/g, '<br>');
      }
    }

    function extractFileLinks(text) {
      var matches = String(text).match(/\/files\/[\w./%-]+/g);
      if (!matches) return [];
      var seen = {};
      var list = [];
      for (var i = 0; i < matches.length; i++) {
        var item = matches[i];
        if (seen[item]) continue;
        seen[item] = true;
        list.push(item);
      }
      return list;
    }

    function renderFileActions(paths) {
      if (!paths || paths.length === 0) return '';
      var t = T();
      return '<div class="file-action-list">' + paths.map(function (p) {
        var name = p.split('/').pop() || p;
        return '<div class="file-action-item">' +
          '<div class="file-action-name">' + esc(name) + '</div>' +
          '<div class="file-actions">' +
          '<a class="file-button" href="' + escAttr(p) + '" target="_blank" rel="noreferrer">' + esc(t.openFile) + '</a>' +
          '<a class="file-button" href="' + escAttr(p) + '" download>' + esc(t.downloadFile) + '</a>' +
          '</div></div>';
      }).join('') + '</div>';
    }

    function traceTypeTitle(type, t) {
      switch (type) {
        case 'run_start': return t.evtRunStart;
        case 'agent_query_start': return t.evtRunStart;
        case 'run_end': return t.evtRunEnd;
        case 'run_error': return t.evtRunError;
        case 'stream_output': return t.evtStream;
        case 'container_spawn': return t.evtContainer;
        case 'ipc_send': return t.evtIpc;
        case 'agent_thinking': return t.evtThinking;
        case 'agent_tool_use': return t.evtToolUse;
        default: return t.evtUnknown + ' · ' + type;
      }
    }
    function traceParsedPayload(payloadStr) {
      try { return JSON.parse(payloadStr); } catch (e) { return null; }
    }
    function traceRawPretty(payloadStr) {
      try { return JSON.stringify(JSON.parse(payloadStr), null, 2); } catch (e) { return String(payloadStr); }
    }
    function traceExtraEvtClass(r, parsed) {
      if (r.type === 'run_end' && parsed && parsed.status === 'error') return ' evt-trace-run_end_err';
      if (r.type === 'run_end') return ' evt-trace-run_end_ok';
      return '';
    }
    /* ── Process step icon class ── */
    function pstepIconClass(type) {
      switch (type) {
        case 'agent_thinking': return 'think';
        case 'agent_tool_use': return 'tool';
        case 'ipc_send': return 'ipc';
        case 'run_error': return 'err';
        case 'container_spawn': return 'spawn';
        default: return 'spawn';
      }
    }
    function pstepIconLabel(type) {
      switch (type) {
        case 'agent_thinking': return 'T';
        case 'agent_tool_use': return '⚙';
        case 'ipc_send': return '↗';
        case 'container_spawn': return '▶';
        case 'run_error': return '!';
        default: return '·';
      }
    }

    function renderProcessStep(r, t) {
      var parsed = traceParsedPayload(r.payload);
      var cls = pstepIconClass(r.type);
      var icon = pstepIconLabel(r.type);
      var label = '';
      var detail = '';
      var time = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

      if (r.type === 'agent_thinking' && parsed) {
        label = t.evtThinking;
        detail = parsed.text || '';
      } else if (r.type === 'agent_tool_use' && parsed) {
        label = '<span class="pstep-tool-name">' + esc(String(parsed.toolName || '')) + '</span>';
        detail = parsed.toolInput || '';
      } else if (r.type === 'container_spawn' && parsed) {
        label = t.evtContainer;
        detail = parsed.containerName || '';
      } else if (r.type === 'ipc_send' && parsed) {
        label = t.evtIpc;
        detail = parsed.preview || parsed.caption || parsed.filePath || '';
      } else if (r.type === 'run_error' && parsed) {
        label = t.evtRunError;
        detail = parsed.message || JSON.stringify(parsed);
      } else {
        label = traceTypeTitle(r.type, t);
        detail = r.payload ? traceRawPretty(r.payload) : '';
      }

      var detailHtml = '';
      if (detail) {
        var detailStr = String(detail);
        if (detailStr.length <= 80) {
          detailHtml = '<div class="pstep-detail short">' + esc(detailStr) + '</div>';
        } else {
          var summary = esc(detailStr.slice(0, 60).replace(/\n/g, ' ')) + '…';
          detailHtml = '<details class="pstep-collapse"><summary>' + summary + '</summary>' +
            '<div class="pstep-collapse-body">' + esc(detailStr) + '</div></details>';
        }
      }
      return '<div class="pstep">' +
        '<div class="pstep-icon ' + cls + '">' + icon + '</div>' +
        '<div class="pstep-body"><span class="pstep-label">' + label + '</span>' +
        (time ? '<span class="pstep-time">' + esc(time) + '</span>' : '') +
        detailHtml +
        '</div></div>';
    }

    /**
     * Build response bubbles from steps.
     * Each stream_output becomes a response bubble; preceding thinking/tool steps
     * are grouped as collapsible process steps INSIDE that bubble.
     * If there are trailing steps with no stream_output, they form a bubble with
     * just the process steps (in-progress state).
     */
    function buildResponseBubbles(steps, endEvent, t) {
      var bubbles = [];
      var pending = []; // accumulates non-output steps

      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        if (s.type === 'stream_output') {
          bubbles.push({ process: pending.slice(), output: s });
          pending = [];
        } else {
          pending.push(s);
        }
      }
      // Trailing steps without output yet (running or error)
      if (pending.length > 0 || bubbles.length === 0) {
        bubbles.push({ process: pending.slice(), output: null });
      }

      var html = '';
      for (var b = 0; b < bubbles.length; b++) {
        var bub = bubbles[b];
        var parsed = bub.output ? traceParsedPayload(bub.output.payload) : null;
        var outputText = parsed && parsed.preview ? String(parsed.preview) : '';
        var isError = parsed && parsed.status === 'error';
        var isLastBubble = (b === bubbles.length - 1);

        html += '<div class="response-bubble">';

        // Process steps (collapsible)
        if (bub.process.length > 0) {
          var stepsHtml = '';
          for (var p = 0; p < bub.process.length; p++) {
            stepsHtml += renderProcessStep(bub.process[p], t);
          }
          var processLabel = bub.process.length + (bub.process.length === 1 ? ' step' : ' steps');
          html += '<details class="process-steps"' + (isLastBubble && !bub.output ? ' open' : '') + '>';
          html += '<summary>' + esc(processLabel) + '</summary>';
          html += '<div class="process-steps-list">' + stepsHtml + '</div>';
          html += '</details>';
        }

        // Message content
        if (bub.output && outputText) {
          html += '<div class="response-content">' + markdownToSafeHtml(outputText) + '</div>';
        } else if (bub.output && isError) {
          html += '<div class="response-error">✗ ' + esc(parsed && parsed.preview ? String(parsed.preview) : 'Error') + '</div>';
        }

        html += '</div>';
      }

      // run_end error (distinct from stream_output error)
      if (endEvent) {
        var endParsed = traceParsedPayload(endEvent.payload);
        if (endParsed && endParsed.error) {
          html += '<div class="response-bubble"><div class="response-error">✗ ' + esc(String(endParsed.error)) + '</div></div>';
        }
      }

      return html;
    }

    function stripXmlTags(s) {
      return String(s)
        .replace(/<\/?(messages|message|system)[^>]*>/gi, '')
        .replace(/\s*sender="[^"]*"/gi, '')
        .replace(/\s*time="[^"]*"/gi, '')
        .trim();
    }

    function renderList(rows) {
      var t = T();
      // API returns newest-first (ORDER BY id DESC); reverse to chronological
      rows = rows.slice().reverse();
      var tasks = [];
      var current = null;

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (r.type === 'run_start' || r.type === 'agent_query_start') {
          // agent_query_start = follow-up query within same container session
          // Treat it as a new task card so each user message is separate.
          current = { start: r, steps: [], end: null };
          tasks.push({ type: 'task', task: current });
        } else if (r.type === 'run_end' && current) {
          current.end = r;
          current = null;
        } else if (current) {
          current.steps.push(r);
        } else {
          tasks.push({ type: 'standalone', event: r });
        }
      }

      var html = '';
      for (var g = 0; g < tasks.length; g++) {
        var grp = tasks[g];
        if (grp.type === 'standalone') {
          var ev = grp.event;
          var evParsed = traceParsedPayload(ev.payload);
          var evTitle = traceTypeTitle(ev.type, t);
          var evTime = ev.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
          var evCls = pstepIconClass(ev.type);
          var evIcon = pstepIconLabel(ev.type);
          var evLabel = evTitle;
          var evDetail = '';
          if (ev.type === 'agent_thinking' && evParsed) {
            evDetail = evParsed.text || '';
          } else if (ev.type === 'agent_tool_use' && evParsed) {
            evLabel = evTitle + ': <span class="pstep-tool-name">' + esc(String(evParsed.toolName || '')) + '</span>';
            evDetail = typeof evParsed.toolInput === 'object' ? JSON.stringify(evParsed.toolInput, null, 2) : String(evParsed.toolInput || '');
          } else if (ev.type === 'stream_output' && evParsed) {
            evDetail = evParsed.result || evParsed.text || evParsed.preview || '';
          } else if (ev.type === 'container_spawn' && evParsed) {
            evDetail = evParsed.containerName || '';
          } else if (ev.type === 'ipc_send' && evParsed) {
            evDetail = evParsed.preview || evParsed.caption || evParsed.filePath || '';
          } else if (ev.type === 'run_error' && evParsed) {
            evDetail = evParsed.message || JSON.stringify(evParsed);
          } else if (evParsed) {
            evDetail = evParsed.preview || (ev.payload ? traceRawPretty(ev.payload) : '');
          }
          html += '<div class="evt-standalone">';
          html += '<div class="evt-s-header">';
          html += '<span class="evt-s-icon pstep-icon ' + evCls + '">' + evIcon + '</span>';
          html += '<span class="evt-s-title">' + evLabel + '</span>';
          if (evTime) html += '<span class="evt-s-time">' + esc(evTime) + '</span>';
          html += '</div>';
          if (evDetail) {
            var evShort = evDetail.length <= 60;
            if (evShort) {
              html += '<div class="evt-s-detail">' + esc(evDetail) + '</div>';
            } else {
              var evSummaryText = esc(evDetail.slice(0, 60).replace(/\n/g, ' ')) + '…';
              html += '<details class="evt-s-collapse"><summary>' + evSummaryText + '</summary>';
              html += '<div class="evt-s-collapse-body">' + esc(evDetail) + '</div>';
              html += '</details>';
            }
          }
          html += '</div>';
        } else {
          var task = grp.task;
          var parsed = traceParsedPayload(task.start.payload);
          // run_start uses "preview", agent_query_start uses "text"
          var rawPreview = parsed ? (parsed.preview || parsed.text || '') : '';
          var preview = rawPreview ? stripXmlTags(String(rawPreview)).slice(0, 200) : '';
          var statusClass = task.end ? (traceParsedPayload(task.end.payload)?.status === 'error' ? 'err' : 'ok') : '';
          var statusLabel = task.end ? (statusClass === 'err' ? '✗ ' + t.evtRunError : '✓ ' + t.evtRunEnd) : '';
          var time = task.start.created_at ? new Date(task.start.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
          var folder = task.start.group_folder || '';
          var isLast = (g === tasks.length - 1);
          var cardClass = 'task-card' + (statusClass === 'err' ? ' is-error' : '');

          var runTs = task.start.created_at || '';
          html += '<details class="' + cardClass + '" data-run-ts="' + escAttr(runTs) + '" ' + (isLast ? 'open' : '') + '>';
          html += '<summary class="task-header">';
          html += '<div class="task-status ' + statusClass + '"></div>';
          html += '<div class="task-info">';
          html += '<div class="task-prompt">' + (preview ? esc(preview) : t.evtRunStart) + '</div>';
          html += '<div class="task-meta">';
          html += '<span>' + esc(time) + '</span>';
          html += '<span>' + esc(folder) + '</span>';
          html += '<span>' + statusLabel + '</span>';
          html += '</div></div>';
          html += '<svg class="task-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
          html += '</summary>';
          html += '<div class="task-body">';
          html += buildResponseBubbles(task.steps, task.end, t);
          html += '</div></details>';
        }
      }

      timeline.innerHTML = html;
      timeline.scrollTop = timeline.scrollHeight;
    }

    async function loadGroups() {
      var res = await fetch('/api/workspace/groups', { headers: authHeaders() });
      if (!res.ok) return;
      var data = await res.json();
      var prev = groupSel.value;
      while (groupSel.options.length > 1) groupSel.remove(1);
      (data.folders || []).forEach(function (f) {
        var o = document.createElement('option');
        o.value = f; o.textContent = f;
        groupSel.appendChild(o);
      });
      if (prev && Array.prototype.some.call(groupSel.options, function (o) { return o.value === prev; })) groupSel.value = prev;
    }

    function traceListQuery() {
      var g = groupSel.value;
      var q = '/api/trace/list?limit=400' + (g ? '&group_folder=' + encodeURIComponent(g) : '');
      if (!traceShowStream) q += '&compact=1';
      return q;
    }

    async function loadTrace() {
      var res = await fetch(traceListQuery(), { headers: authHeaders() });
      if (!res.ok) { timeline.textContent = T().loadFail; return; }
      var data = await res.json();
      renderList(data.events || []);
    }

    async function loadTree() {
      var g = groupSel.value;
      if (!g) { treeEl.textContent = T().treePick; return; }
      var res = await fetch('/api/workspace/tree?group_folder=' + encodeURIComponent(g), { headers: authHeaders() });
      if (!res.ok) { treeEl.textContent = T().loadFail; return; }
      var data = await res.json();
      function nodeHtml(n) {
        if (n.type === 'dir') {
          var inner = (n.children || []).map(nodeHtml).join('');
          return '<details open><summary>' + esc(n.name) + '/</summary><div>' + inner + '</div></details>';
        }
        return '<div>· ' + esc(n.name) + '</div>';
      }
      treeEl.innerHTML = (data.tree || []).map(nodeHtml).join('') || T().treeEmpty;
    }

    function ensureTrace() {
      if (traceBooted) { startTraceSse(); return; }
      traceBooted = true;
      loadGroups().then(function () {
        loadTrace();
        loadTree();
        startTraceSse();
      });
    }

    // Keep trace SSE alive at all times so chat panel can stream too
    function ensureTraceSseAlways() {
      if (!traceEs) startTraceSse();
    }

    function isWide() { return false; }
    function applyLayout() {
      // Chat is always the main area. Trace is an on-demand drawer.
      if (panelChat) panelChat.classList.remove('hidden-narrow');
      ensureTraceSseAlways();   // keep trace SSE alive for streaming
    }
    function setTab() { /* tabs removed — no-op kept for callers */ }

    /* Trace open/close + activity indicator wired up later in the file. */
    window.matchMedia('(min-width: 981px)').addEventListener('change', applyStoredPanelSizes);
    window.matchMedia('(min-width: 701px)').addEventListener('change', applyStoredPanelSizes);
    window.addEventListener('resize', applyStoredPanelSizes);

    (function bootTabFromUrl() {
      var p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'trace') currentTab = 'trace';
      applyLayout();
    })();

    document.getElementById('reloadTrace').onclick = function () { loadTrace(); loadTree(); };
    groupSel.onchange = function () { loadTrace(); loadTree(); };
    if (traceStreamCb) {
      traceStreamCb.checked = traceShowStream;
      traceStreamCb.addEventListener('change', function () {
        traceShowStream = !!traceStreamCb.checked;
        try { localStorage.setItem('bioclaw-trace-stream', traceShowStream ? '1' : '0'); } catch (e) {}
        loadTrace();
      });
    }

    langBtn.addEventListener('click', function () {
      applyLang(lang === 'zh' ? 'en' : 'zh');
      lastSignature = '';
      refreshMessages();
    });

    function currentTheme() {
      var tt = document.documentElement.getAttribute('data-theme') || 'default';
      return THEMES.indexOf(tt) >= 0 ? tt : 'default';
    }

    function syncThemeUi() {
      if (!themeGrid) return;
      var theme = currentTheme();
      themeGrid.querySelectorAll('.theme-swatch').forEach(function (sw) {
        sw.classList.toggle('is-active', sw.getAttribute('data-theme') === theme);
      });
    }

    function setTheme(theme, persist) {
      var t = THEMES.indexOf(theme) >= 0 ? theme : 'default';
      if (t === 'default') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
      if (persist) {
        try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
      }
      syncThemeUi();
    }

    function loadTheme() {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
      // Migrate legacy values: 'light' → default, 'dark' → midnight
      if (saved === 'light') saved = 'default';
      if (saved === 'dark') saved = 'midnight';
      setTheme(saved || 'default', false);
    }
    loadTheme();

    if (themeGrid) {
      themeGrid.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest ? event.target.closest('.theme-swatch') : null;
        if (!btn) return;
        setTheme(btn.getAttribute('data-theme') || 'default', true);
      });
    }

    /* ──────── Thread rail (col 1) ────────
       Wide (>=901px): rail is always an inline grid column; ☰ toggles its
         width between var(--rail-w) and 0 via body.rail-collapsed.
       Narrow (<=900px): rail is a fixed overlay drawer; ☰ slides it in/out. */
    var threadRailEl = document.getElementById('threadRail');
    var railBackdrop = document.getElementById('railBackdrop');
    var RAIL_COLLAPSED_KEY = 'bioclaw-rail-collapsed';

    function isNarrow() { return window.matchMedia('(max-width: 900px)').matches; }

    function openThreadRailNarrow() {
      if (threadRailEl) threadRailEl.classList.add('is-open');
      if (railBackdrop) { railBackdrop.classList.add('is-open'); railBackdrop.setAttribute('aria-hidden', 'false'); }
    }
    function closeThreadRailNarrow() {
      if (threadRailEl) threadRailEl.classList.remove('is-open');
      if (railBackdrop) { railBackdrop.classList.remove('is-open'); railBackdrop.setAttribute('aria-hidden', 'true'); }
    }
    function toggleThreadRail() {
      if (isNarrow()) {
        if (threadRailEl && threadRailEl.classList.contains('is-open')) closeThreadRailNarrow();
        else openThreadRailNarrow();
      } else {
        var collapsed = !document.body.classList.contains('rail-collapsed');
        document.body.classList.toggle('rail-collapsed', collapsed);
        try { localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (e) {}
      }
    }
    // Narrow-screen back-compat aliases used elsewhere
    function closeThreadRail() { closeThreadRailNarrow(); }

    (function loadRailState() {
      var collapsed = false;
      try { collapsed = localStorage.getItem(RAIL_COLLAPSED_KEY) === '1'; } catch (e) {}
      document.body.classList.toggle('rail-collapsed', collapsed);
    })();

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleThreadRail);
    if (railBackdrop) railBackdrop.addEventListener('click', closeThreadRailNarrow);

    /* ──────── Trace panel (col 3) ────────
       Wide: toggleable inline column via body.trace-open.
       Narrow: slide-in overlay from the right. */
    var panelTraceEl = document.getElementById('panelTrace');
    var TRACE_OPEN_KEY = 'bioclaw-trace-open';

    function scrollTraceToRun(targetTs) {
      if (!timeline || !targetTs) return;
      // Find the task card whose run_ts is the latest one <= targetTs.
      var cards = timeline.querySelectorAll('.task-card[data-run-ts]');
      var match = null;
      for (var i = 0; i < cards.length; i++) {
        var ts = cards[i].getAttribute('data-run-ts') || '';
        if (ts <= targetTs && (!match || ts > (match.getAttribute('data-run-ts') || ''))) {
          match = cards[i];
        }
      }
      if (!match) match = cards[cards.length - 1];   // fallback to most recent
      if (!match) return;
      // Collapse all others, expand the match
      cards.forEach(function (c) { c.removeAttribute('open'); });
      match.setAttribute('open', '');
      // Scroll into view + flash
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      match.classList.add('is-highlighted');
      setTimeout(function () { match.classList.remove('is-highlighted'); }, 1600);
    }

    function syncTraceGroupToCurrentChat() {
      // Auto-pick the current chat's workspace folder in the trace group dropdown
      if (!groupSel) return;
      var folder = workspaceFolderForChat(chatJid);
      var hasOption = Array.prototype.some.call(groupSel.options, function (o) { return o.value === folder; });
      if (hasOption && groupSel.value !== folder) {
        groupSel.value = folder;
      }
    }

    function openTracePanel() {
      document.body.classList.add('trace-open');
      if (openTraceBtn) openTraceBtn.classList.remove('has-activity');
      ensureTrace();
      loadGroups().then(function () {
        syncTraceGroupToCurrentChat();
        loadTrace();
        loadTree();
      });
      try { localStorage.setItem(TRACE_OPEN_KEY, '1'); } catch (e) {}
    }
    function closeTracePanel() {
      document.body.classList.remove('trace-open');
      try { localStorage.setItem(TRACE_OPEN_KEY, '0'); } catch (e) {}
    }
    function toggleTracePanel() {
      if (document.body.classList.contains('trace-open')) closeTracePanel();
      else openTracePanel();
    }
    (function loadTraceState() {
      var open = false;
      try { open = localStorage.getItem(TRACE_OPEN_KEY) === '1'; } catch (e) {}
      if (open) document.body.classList.add('trace-open');
    })();
    if (openTraceBtn) openTraceBtn.addEventListener('click', toggleTracePanel);
    if (closeTraceBtn) closeTraceBtn.addEventListener('click', closeTracePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (isNarrow() && threadRailEl && threadRailEl.classList.contains('is-open')) closeThreadRailNarrow();
      else if (isNarrow() && document.body.classList.contains('trace-open')) closeTracePanel();
    });

    /* ──────── Streaming bubble + work-status strip ──────── */

    var streamingBubble = null;
    var workStartTime = null;
    var workTimerHandle = null;
    var lastTraceTickAt = 0;
    var traceTickPending = false;
    // Once the final assistant message has rendered we lock the streaming
    // bubble out until the user sends another message, so late-arriving
    // trace events can't spawn a duplicate bubble.
    var streamingLocked = false;

    function scrollChatToBottom() {
      if (messagesEl) {
        // Use rAF so we scroll after layout settles
        requestAnimationFrame(function () { messagesEl.scrollTop = messagesEl.scrollHeight; });
      }
    }

    function ensureStreamingBubble() {
      if (streamingLocked) return null;
      if (streamingBubble && streamingBubble.parentNode) return streamingBubble;
      var t = T();
      var el = document.createElement('article');
      el.className = 'bubble-row bot streaming-pending';
      el.setAttribute('data-streaming', '1');
      el.innerHTML =
        '<div class="bubble-avatar" aria-hidden="true">B</div>' +
        '<div class="bubble bot is-streaming">' +
          '<div class="meta">' +
            '<span class="badge">' + esc(t.roleAssistant) + '</span>' +
            esc(assistantName) +
            '<span class="thinking-pill" data-thinking-pill="1">' +
              '<span class="thinking-pill-spinner"></span>' +
              '<span class="thinking-pill-label">' + esc(t.workThinking) + '</span>' +
            '</span>' +
            '<button type="button" class="trace-jump-btn" data-trace-jump="1">' + esc(t.viewTrace || '查看追踪 →') + '</button>' +
          '</div>' +
          '<div class="content"></div>' +
        '</div>';
      messagesEl.appendChild(el);
      streamingBubble = el;
      scrollChatToBottom();
      return el;
    }

    function clearStreamingBubble() {
      // Belt-and-braces: remove any DOM node marked as streaming, not just our variable
      var all = messagesEl ? messagesEl.querySelectorAll('[data-streaming="1"]') : [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].parentNode) all[i].parentNode.removeChild(all[i]);
      }
      streamingBubble = null;
      lastStepsSig = '';
      lastStreamText = '';
    }

    var lastStreamText = '';
    function updateStreamingBubble(text) {
      var el = ensureStreamingBubble();
      if (!el || !text) return;
      if (text === lastStreamText) return;   // dedupe (kills flicker)
      lastStreamText = text;
      var content = el.querySelector('.content');
      if (content) content.innerHTML = markdownToSafeHtml(text);
      scrollChatToBottom();
    }

    function truncateText(s, max) {
      s = String(s || '');
      return s.length > max ? s.slice(0, max) + '…' : s;
    }

    function stepCardHtml(step) {
      var kind = step.kind;       // 'thinking' | 'tool' | 'ipc' | 'spawn' | 'err'
      var icon = '·';
      if (kind === 'thinking') icon = '💭';
      else if (kind === 'tool') icon = '⚙';
      else if (kind === 'ipc') icon = '↗';
      else if (kind === 'spawn') icon = '▶';
      else if (kind === 'err') icon = '!';
      var label = esc(step.label || '');
      var detail = step.detail ? '<div class="inline-step-detail">' + esc(truncateText(step.detail, 280)) + '</div>' : '';
      return '<div class="inline-step inline-step-' + kind + '">' +
        '<span class="inline-step-icon" aria-hidden="true">' + icon + '</span>' +
        '<div class="inline-step-body"><div class="inline-step-label">' + label + '</div>' + detail + '</div>' +
      '</div>';
    }

    var lastStepsSig = '';
    function updateStreamingSteps(steps, labelOverride) {
      if (!steps || !steps.length) return;
      var el = ensureStreamingBubble();
      if (!el) return;
      var sig = String(steps.length) + '|' + steps.map(function (s) {
        return (s.kind || '') + ':' + (s.label || '') + ':' + (s.detail || '').length;
      }).join(';');
      var labelEl = el.querySelector('.inline-steps-label');
      if (labelEl && labelOverride && labelEl.textContent !== labelOverride) {
        labelEl.textContent = labelOverride;
      }
      if (sig === lastStepsSig) return;   // unchanged → skip DOM rebuild (kills flicker)
      lastStepsSig = sig;
      var list = el.querySelector('.inline-steps-list');
      var count = el.querySelector('.inline-steps-count');
      if (list) list.innerHTML = steps.map(stepCardHtml).join('');
      if (count) count.textContent = ' · ' + steps.length;
      scrollChatToBottom();
    }

    /*
     * Finalize the streaming bubble — turn it into the permanent final bubble.
     * Keeps inline steps (collapsed), removes streaming class, and tags the DOM
     * node with the bot message's timestamp so render() knows to skip that
     * message when re-building the list (avoids duplicates).
     */
    function finalizeStreamingBubble(msgTimestamp) {
      if (!streamingBubble) return;
      var bubble = streamingBubble.querySelector('.bubble');
      if (bubble) bubble.classList.remove('is-streaming');
      // Replace the thinking-pill (spinner + "thinking") with a quiet "view trace" pill
      var pill = streamingBubble.querySelector('[data-thinking-pill]');
      if (pill) {
        pill.classList.add('is-done');
        pill.innerHTML = '<span class="thinking-pill-label">' + esc(T().thoughtsDone) + '</span>';
      }
      streamingBubble.removeAttribute('data-streaming');  // no longer live
      if (msgTimestamp) {
        streamingBubble.setAttribute('data-msg-ts', msgTimestamp);
        streamingBubble.setAttribute('data-row-ts', msgTimestamp);
      }
      streamingBubble = null;
    }

    function startWorkStrip(label, detail) {
      if (!workStrip) return;
      workStrip.classList.remove('is-error');
      workStrip.classList.add('is-active');
      if (workStripLabel) workStripLabel.textContent = label || T().workThinking;
      if (workStripDetail) workStripDetail.textContent = detail || '';
      workStartTime = Date.now();
      if (workTimerHandle) clearInterval(workTimerHandle);
      workTimerHandle = setInterval(function () {
        if (workStripTime) {
          var s = Math.round((Date.now() - workStartTime) / 1000);
          workStripTime.textContent = s + 's';
        }
      }, 1000);
      if (workStripTime) workStripTime.textContent = '0s';
    }

    function updateWorkStrip(label, detail) {
      if (!workStrip || !workStrip.classList.contains('is-active')) return;
      if (label != null && workStripLabel) workStripLabel.textContent = label;
      if (detail != null && workStripDetail) workStripDetail.textContent = detail;
    }

    function stopWorkStrip(opts) {
      if (!workStrip) return;
      if (workTimerHandle) { clearInterval(workTimerHandle); workTimerHandle = null; }
      if (opts && opts.error) {
        workStrip.classList.add('is-error');
        if (workStripLabel) workStripLabel.textContent = T().workError;
        if (workStripDetail && opts.detail) workStripDetail.textContent = opts.detail;
        setTimeout(function () { workStrip.classList.remove('is-active', 'is-error'); }, 4500);
      } else {
        setTimeout(function () { workStrip.classList.remove('is-active'); }, 800);
      }
    }

    function workspaceFolderForChat(jid) {
      var t = threads.find(function (x) { return x.chatJid === jid; });
      if (t && t.workspaceFolder) return t.workspaceFolder;
      // Fallback: derive workspace folder from chatJid pattern (thread-XXX@local.web → thread-XXX)
      // This matters for fresh threads not yet in the threads list.
      if (typeof jid === 'string') {
        var atIdx = jid.indexOf('@');
        var prefix = atIdx > 0 ? jid.slice(0, atIdx) : jid;
        if (prefix && prefix !== 'local-web') return prefix;
      }
      return 'local-web';
    }

    async function processTraceTick() {
      // Throttle to avoid hammering the API on bursty stream_output events
      var now = Date.now();
      if (now - lastTraceTickAt < 120) {
        if (traceTickPending) return;
        traceTickPending = true;
        setTimeout(function () { traceTickPending = false; processTraceTick(); }, 130);
        return;
      }
      lastTraceTickAt = now;
      try {
        var url = '/api/trace/list?limit=80&group_folder=' + encodeURIComponent(workspaceFolderForChat(chatJid));
        var res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) return;
        var data = await res.json();
        var events = (data.events || []).slice();
        if (!events.length) {
          // Don't clear the streaming bubble on empty events — trace data may
          // simply not have arrived yet. Only stop work-strip after a grace period.
          return;
        }
        events.sort(function (a, b) { return (a.id || 0) - (b.id || 0); });

        // Walk forwards to find current run state.
        var inRun = false;
        var lastTool = null;
        var lastPreview = '';
        var hadError = false;
        var steps = [];    // accumulated inline steps for current run
        var lastEventKind = '';   // 'stream' | 'tool' | 'ipc' | 'thinking' | ''

        events.forEach(function (e) {
          var p = null;
          try { p = e.payload ? JSON.parse(e.payload) : null; } catch (_) { p = null; }
          if (e.type === 'run_start' || e.type === 'agent_query_start' || e.type === 'container_spawn') {
            inRun = true; lastTool = null; lastPreview = ''; hadError = false; steps = []; lastEventKind = '';
            if (e.type === 'container_spawn' && p) {
              steps.push({ kind: 'spawn', label: 'Container started', detail: p.containerName || '' });
            }
          } else if (e.type === 'agent_thinking' && p) {
            steps.push({ kind: 'thinking', label: 'Thinking', detail: p.text || '' });
            lastEventKind = 'thinking';
          } else if (e.type === 'agent_tool_use' && p) {
            lastTool = p.toolName || lastTool;
            var toolInput = p.toolInput;
            var detail = '';
            if (typeof toolInput === 'string') {
              detail = toolInput;
            } else if (toolInput && typeof toolInput === 'object') {
              try { detail = JSON.stringify(toolInput); } catch (_) {}
            }
            steps.push({ kind: 'tool', label: String(p.toolName || 'Tool'), detail: detail });
            lastPreview = '';   // tool kicks in → reset preview so we don't keep the old one stuck
            lastEventKind = 'tool';
          } else if (e.type === 'ipc_send' && p) {
            steps.push({ kind: 'ipc', label: 'IPC', detail: p.preview || p.caption || p.filePath || '' });
            lastEventKind = 'ipc';
          } else if (e.type === 'stream_output' && p) {
            if (p.preview) lastPreview = p.preview;
            lastEventKind = 'stream';
          } else if (e.type === 'run_end') {
            inRun = false;
          } else if (e.type === 'run_error') {
            inRun = false; hadError = true;
            if (p) steps.push({ kind: 'err', label: 'Error', detail: p.message || '' });
          }
        });

        if (inRun) {
          var labelText = lastTool ? (T().workRunning + ' · ' + lastTool) : T().workThinking;
          if (!workStrip.classList.contains('is-active')) {
            startWorkStrip(lastTool ? T().workRunning : T().workThinking, lastTool || '');
          } else if (lastTool) {
            updateWorkStrip(T().workRunning, lastTool);
          } else {
            updateWorkStrip(T().workThinking, '');
          }
          ensureStreamingBubble();
          // Update the thinking-pill with current activity (no inline step list)
          if (streamingBubble) {
            var pillLabel = streamingBubble.querySelector('.thinking-pill-label');
            if (pillLabel) pillLabel.textContent = labelText;
          }
          // Decide what to show in the bubble:
          //  - If a tool/thinking step just happened (steps exist but no fresh stream),
          //    show a compact step summary so the user knows what's happening.
          //  - If the agent is currently streaming text (lastEventKind === 'stream'),
          //    show the live partial response — that's the answer being typed out.
          if (streamingBubble) {
            var contentEl = streamingBubble.querySelector('.content');
            if (contentEl) {
              var html = '';
              if (steps.length) {
                var statusLines = steps.slice(-5).map(function (s) {
                  if (s.kind === 'thinking') return '💭 ' + esc(truncateText(s.detail, 120));
                  if (s.kind === 'tool') return '⚙ ' + esc(s.label) + (s.detail ? '：' + esc(truncateText(s.detail, 80)) : '');
                  if (s.kind === 'spawn') return '▶ ' + esc(s.detail);
                  if (s.kind === 'ipc') return '↗ ' + esc(truncateText(s.detail, 80));
                  return '· ' + esc(truncateText(s.detail || s.label, 100));
                });
                html += '<div class="streaming-status">' + statusLines.join('<br>') + '</div>';
              }
              if (lastEventKind === 'stream' && lastPreview) {
                html += '<div class="streaming-text">' + markdownToSafeHtml(lastPreview) + '</div>';
              }
              if (html && contentEl.innerHTML !== html) {
                contentEl.innerHTML = html;
                scrollChatToBottom();
              }
            }
          }
          // Hint that trace has fresh content if user hasn't opened it
          if (openTraceBtn && !document.body.classList.contains('trace-open')) {
            openTraceBtn.classList.add('has-activity');
          }
        } else {
          if (hadError) {
            stopWorkStrip({ error: true, detail: lastTool || '' });
          } else {
            stopWorkStrip();
          }
          // Run is over per the trace, but the final message may not be in the
          // DB yet (race between run_end recording and sendToChannel). Don't
          // touch the streaming bubble here — let the chat SSE trigger render()
          // when the message actually arrives, and render() will finalize the
          // bubble in-place (lines ~2005-2037). This avoids the "bubble
          // disappears, full answer pops in later" flicker.
          await refreshMessages();
        }
      } catch (e) {}
    }

    /* ──────── Welcome hero (empty state) ──────── */

    var welcomeHeroEl = null;
    function renderWelcomeHero() {
      var t = T();
      welcomeHeroEl = document.createElement('div');
      welcomeHeroEl.className = 'welcome-hero';
      welcomeHeroEl.innerHTML =
        '<img class="welcome-mark welcome-mark-img" src="/favicon.jpg" alt="BioClaw" />' +
        '<h1 class="welcome-title">' + esc(t.welcomeTitle) + '</h1>' +
        '<p class="welcome-sub">' + esc(t.welcomeSub) + '</p>' +
        '<div class="welcome-suggestions">' +
          '<button type="button" class="welcome-suggestion" data-prompt="' + escAttr('用 BioPython 读取一个 FASTA 文件并计算 GC 含量') + '">' +
            '<div class="welcome-suggestion-title">' + esc(t.suggestFastaTitle) + '</div>' +
            '<div class="welcome-suggestion-desc">' + esc(t.suggestFastaDesc) + '</div>' +
          '</button>' +
          '<button type="button" class="welcome-suggestion" data-prompt="' + escAttr('帮我 BLAST 一段未知 DNA 序列：ATGCGATCGATCGATCG') + '">' +
            '<div class="welcome-suggestion-title">' + esc(t.suggestBlastTitle) + '</div>' +
            '<div class="welcome-suggestion-desc">' + esc(t.suggestBlastDesc) + '</div>' +
          '</button>' +
          '<button type="button" class="welcome-suggestion" data-prompt="' + escAttr('给我一个用 matplotlib 画 volcano plot 的 Python 脚本') + '">' +
            '<div class="welcome-suggestion-title">' + esc(t.suggestDataTitle) + '</div>' +
            '<div class="welcome-suggestion-desc">' + esc(t.suggestDataDesc) + '</div>' +
          '</button>' +
          '<button type="button" class="welcome-suggestion" data-prompt="' + escAttr('查 PubMed 找 2024 年以后 CRISPR off-target 相关的高引论文') + '">' +
            '<div class="welcome-suggestion-title">' + esc(t.suggestPubmedTitle) + '</div>' +
            '<div class="welcome-suggestion-desc">' + esc(t.suggestPubmedDesc) + '</div>' +
          '</button>' +
        '</div>';
      welcomeHeroEl.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest ? event.target.closest('.welcome-suggestion') : null;
        if (!btn) return;
        var p = btn.getAttribute('data-prompt');
        if (p && input) {
          input.value = p;
          input.focus();
        }
      });
      return welcomeHeroEl;
    }

    function showWelcomeIfEmpty() {
      if (!messagesEl) return;
      if (messagesEl.children.length === 0) {
        messagesEl.appendChild(renderWelcomeHero());
      }
    }
    function hideWelcome() {
      if (messagesEl) {
        var hero = messagesEl.querySelector('.welcome-hero');
        if (hero) hero.remove();
      }
    }

    function clampComposerHeight(value) {
      var viewportMax = Math.floor(window.innerHeight * 0.56);
      return Math.max(104, Math.min(viewportMax, Math.round(value || 0)));
    }

    function setComposerHeight(value, persist) {
      var height = clampComposerHeight(value);
      input.style.height = height + 'px';
      if (persist) {
        try { localStorage.setItem(COMPOSER_HEIGHT_KEY, String(height)); } catch (e) {}
      }
    }

    (function loadComposerHeight() {
      var stored = null;
      try { stored = localStorage.getItem(COMPOSER_HEIGHT_KEY); } catch (e) {}
      setComposerHeight(stored ? Number(stored) : 148, false);
    })();

    if (composerResizer) {
      var resizeState = null;

      function finishComposerResize(event) {
        if (!resizeState) return;
        if (event && resizeState.pointerId != null && event.pointerId != null && event.pointerId !== resizeState.pointerId) return;
        document.body.classList.remove('is-resizing-composer');
        setComposerHeight(input.getBoundingClientRect().height, true);
        resizeState = null;
      }

      composerResizer.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        resizeState = {
          pointerId: event.pointerId,
          startY: event.clientY,
          startHeight: input.getBoundingClientRect().height,
        };
        composerResizer.setPointerCapture(event.pointerId);
        document.body.classList.add('is-resizing-composer');
      });

      composerResizer.addEventListener('pointermove', function (event) {
        if (!resizeState || event.pointerId !== resizeState.pointerId) return;
        setComposerHeight(resizeState.startHeight + (event.clientY - resizeState.startY), false);
      });

      composerResizer.addEventListener('pointerup', finishComposerResize);
      composerResizer.addEventListener('pointercancel', finishComposerResize);
      composerResizer.addEventListener('dblclick', function () {
        setComposerHeight(148, true);
      });
      composerResizer.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Home') return;
        event.preventDefault();
        if (event.key === 'Home') {
          setComposerHeight(148, true);
          return;
        }
        var delta = event.key === 'ArrowDown' ? 18 : -18;
        setComposerHeight(input.getBoundingClientRect().height + delta, true);
      });
      window.addEventListener('pointerup', finishComposerResize);
    }

    function readStoredNumber(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        var value = Number(raw);
        return Number.isFinite(value) ? value : null;
      } catch (e) {
        return null;
      }
    }

    function writeStoredNumber(key, value) {
      try { localStorage.setItem(key, String(Math.round(value))); } catch (e) {}
    }

    function clearStoredNumber(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }

    function clampMainPanelWidth(value) {
      if (!unifiedLayout) return 0;
      var total = Math.max(0, unifiedLayout.getBoundingClientRect().width - 12);
      var min = 360;
      var max = Math.max(min, total - 360);
      return Math.max(min, Math.min(max, Math.round(value || min)));
    }

    function clampThreadRailWidth(value) {
      if (!chatShell) return 244;
      var total = Math.max(0, chatShell.getBoundingClientRect().width - 12);
      var min = 188;
      var max = Math.max(min, Math.min(420, total - 360));
      return Math.max(min, Math.min(max, Math.round(value || 244)));
    }

    function clampTraceSidebarWidth(value) {
      if (!traceMain) return 280;
      var total = Math.max(0, traceMain.getBoundingClientRect().width - 12);
      var min = 220;
      var max = Math.max(min, Math.min(460, total - 320));
      return Math.max(min, Math.min(max, Math.round(value || 280)));
    }

    function setMainPanelWidth(value, persist) {
      var width = clampMainPanelWidth(value);
      unifiedRoot.style.setProperty('--main-left-size', width + 'px');
      if (persist) writeStoredNumber(MAIN_SPLIT_KEY, width);
    }

    function resetMainPanelWidth() {
      unifiedRoot.style.removeProperty('--main-left-size');
      clearStoredNumber(MAIN_SPLIT_KEY);
    }

    function setThreadRailWidth(value, persist) {
      var width = clampThreadRailWidth(value);
      unifiedRoot.style.setProperty('--thread-rail-w', width + 'px');
      if (persist) writeStoredNumber(THREAD_SPLIT_KEY, width);
    }

    function resetThreadRailWidth() {
      unifiedRoot.style.removeProperty('--thread-rail-w');
      clearStoredNumber(THREAD_SPLIT_KEY);
    }

    function setTraceSidebarWidth(value, persist) {
      var width = clampTraceSidebarWidth(value);
      unifiedRoot.style.setProperty('--trace-sidebar-w', width + 'px');
      if (persist) writeStoredNumber(TRACE_SPLIT_KEY, width);
    }

    function resetTraceSidebarWidth() {
      unifiedRoot.style.removeProperty('--trace-sidebar-w');
      clearStoredNumber(TRACE_SPLIT_KEY);
    }

    function applyStoredPanelSizes() {
      var mainWidth = readStoredNumber(MAIN_SPLIT_KEY);
      if (mainWidth != null && isWide()) setMainPanelWidth(mainWidth, false);

      var railWidth = readStoredNumber(THREAD_SPLIT_KEY);
      if (railWidth != null && window.matchMedia('(min-width: 981px)').matches) setThreadRailWidth(railWidth, false);

      var traceWidth = readStoredNumber(TRACE_SPLIT_KEY);
      if (traceWidth != null && window.matchMedia('(min-width: 701px)').matches) setTraceSidebarWidth(traceWidth, false);
    }

    function installHorizontalResizer(handle, opts) {
      if (!handle) return;
      var state = null;

      function finishResize(event) {
        if (!state) return;
        if (event && state.pointerId != null && event.pointerId != null && event.pointerId !== state.pointerId) return;
        document.body.classList.remove('is-resizing-layout');
        opts.persist(opts.current());
        state = null;
      }

      handle.addEventListener('pointerdown', function (event) {
        if (!opts.enabled()) return;
        event.preventDefault();
        state = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startValue: opts.current(),
        };
        handle.setPointerCapture(event.pointerId);
        document.body.classList.add('is-resizing-layout');
      });

      handle.addEventListener('pointermove', function (event) {
        if (!state || event.pointerId !== state.pointerId) return;
        opts.setFromDrag(state.startValue, event.clientX - state.startX);
      });

      handle.addEventListener('pointerup', finishResize);
      handle.addEventListener('pointercancel', finishResize);
      handle.addEventListener('dblclick', function () {
        if (!opts.enabled()) return;
        opts.reset();
      });
      handle.addEventListener('keydown', function (event) {
        if (!opts.enabled()) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home') return;
        event.preventDefault();
        if (event.key === 'Home') {
          opts.reset();
          return;
        }
        var delta = event.key === 'ArrowRight' ? 24 : -24;
        opts.setFromKeyboard(delta);
      });
      window.addEventListener('pointerup', finishResize);
    }

    installHorizontalResizer(mainPanelResizer, {
      enabled: function () { return isWide(); },
      current: function () { return panelTrace.getBoundingClientRect().width; },
      setFromDrag: function (startValue, delta) { setMainPanelWidth(startValue + delta, false); },
      setFromKeyboard: function (delta) { setMainPanelWidth(panelTrace.getBoundingClientRect().width + delta, true); },
      persist: function (value) { setMainPanelWidth(value, true); },
      reset: resetMainPanelWidth,
    });

    installHorizontalResizer(threadRailResizer, {
      enabled: function () { return window.matchMedia('(min-width: 981px)').matches; },
      current: function () { return threadRail.getBoundingClientRect().width; },
      setFromDrag: function (startValue, delta) { setThreadRailWidth(startValue + delta, false); },
      setFromKeyboard: function (delta) { setThreadRailWidth(threadRail.getBoundingClientRect().width + delta, true); },
      persist: function (value) { setThreadRailWidth(value, true); },
      reset: resetThreadRailWidth,
    });

    installHorizontalResizer(traceSidebarResizer, {
      enabled: function () { return window.matchMedia('(min-width: 701px)').matches; },
      current: function () { return traceSidebar.getBoundingClientRect().width; },
      setFromDrag: function (startValue, delta) { setTraceSidebarWidth(startValue - delta, false); },
      setFromKeyboard: function (delta) { setTraceSidebarWidth(traceSidebar.getBoundingClientRect().width - delta, true); },
      persist: function (value) { setTraceSidebarWidth(value, true); },
      reset: resetTraceSidebarWidth,
    });

    function setSettingsOpen(open) {
      settingsBackdrop.classList.toggle('is-open', open);
      settingsDrawer.classList.toggle('is-open', open);
      settingsBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
      settingsDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    openSettingsBtn.addEventListener('click', function () {
      setSettingsOpen(true);
      refreshManagementPanels();
    });
    closeSettingsBtn.addEventListener('click', function () { setSettingsOpen(false); });
    settingsBackdrop.addEventListener('click', function () { setSettingsOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && settingsDrawer.classList.contains('is-open')) setSettingsOpen(false);
    });

    function formatThreadTime(value) {
      if (!value) return '';
      try {
        return new Date(value).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (e) {
        return String(value);
      }
    }

    function stopChatSse() {
      if (chatEs) {
        chatEs.close();
        chatEs = null;
      }
    }

    function renderThreads() {
      if (!threadListEl) return;
      var t = T();
      if (!threads.length) {
        threadListEl.innerHTML = '<div class="thread-empty">' + esc(t.threadEmpty) + '</div>';
        return;
      }
      threadListEl.innerHTML = threads.map(function (thread) {
        var active = thread.chatJid === chatJid ? ' is-active' : '';
        var title = thread.title || t.threadUntitled;
        var metaTime = formatThreadTime(thread.lastActivity || thread.addedAt);
        return '<div class="thread-item' + active + '" data-chat-jid="' + esc(thread.chatJid) + '" role="button" tabindex="0">' +
          '<div class="thread-item-row">' +
          '<div class="thread-item-main">' +
          '<div class="thread-item-title">' + esc(title) + '</div>' +
          '<div class="thread-item-meta"><span>' + esc(thread.workspaceFolder || '') + '</span><span>' + esc(metaTime) + '</span></div>' +
          '</div>' +
          '<div class="thread-item-actions">' +
          '<button type="button" class="thread-action" data-thread-action="rename" data-chat-jid="' + esc(thread.chatJid) + '" title="' + esc(t.threadRenameAction) + '">✎</button>' +
          '<button type="button" class="thread-action" data-thread-action="archive" data-chat-jid="' + esc(thread.chatJid) + '" title="' + esc(t.threadArchiveAction) + '">×</button>' +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('');
    }

    async function refreshThreads() {
      try {
        var res = await fetch('/api/threads', { headers: authHeaders() });
        if (!res.ok) return;
        var data = await res.json();
        threads = Array.isArray(data.threads) ? data.threads : [];
        if (!threads.some(function (thread) { return thread.chatJid === chatJid; }) && threads[0]) {
          chatJid = threads[0].chatJid;
        }
        if (jidEl) jidEl.textContent = chatJid;
        renderThreads();
      } catch (e) {}
    }

    async function setActiveThread(nextChatJid) {
      if (!nextChatJid || nextChatJid === chatJid) { closeThreadRail(); return; }
      chatJid = nextChatJid;
      lastSignature = '';
      messagesEl.innerHTML = '';
      if (jidEl) jidEl.textContent = chatJid;
      try { localStorage.setItem(THREAD_KEY, chatJid); } catch (e) {}
      renderThreads();
      stopPolling();
      stopChatSse();
      closeThreadRail();
      await refreshMessages();
      await refreshManagementPanels();
      connectChatSse();
      // Re-aim the trace panel at the newly-selected thread
      syncTraceGroupToCurrentChat();
      if (document.body.classList.contains('trace-open')) {
        loadTrace();
        loadTree();
      }
    }

    async function renameThread(threadChatJid) {
      var current = threads.find(function (thread) { return thread.chatJid === threadChatJid; });
      var nextTitle = window.prompt(T().threadRenamePrompt, current && current.title ? current.title : '');
      if (nextTitle === null) return;
      nextTitle = nextTitle.trim();
      if (!nextTitle) return;
      try {
        var res = await fetch('/api/threads/' + encodeURIComponent(threadChatJid), {
          method: 'PATCH',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify({ title: nextTitle }),
        });
        if (!res.ok) throw new Error(T().threadRenameFail);
        await refreshThreads();
      } catch (e) {
        setStatus(e && e.message ? e.message : T().threadRenameFail);
      }
    }

    async function archiveThread(threadChatJid) {
      if (!window.confirm(T().threadArchiveConfirm)) return;
      try {
        var wasActive = chatJid === threadChatJid;
        var res = await fetch('/api/threads/' + encodeURIComponent(threadChatJid), {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(T().threadArchiveFail);
        var data = await res.json();
        await refreshThreads();
        if (data.nextChatJid && wasActive) {
          chatJid = '';
          await setActiveThread(data.nextChatJid);
        } else if (wasActive && threads[0]) {
          chatJid = '';
          await setActiveThread(threads[0].chatJid);
        }
      } catch (e) {
        setStatus(e && e.message ? e.message : T().threadArchiveFail);
      }
    }

    function render(messages) {
      var signature = JSON.stringify(messages.map(function (m) { return [m.id, m.timestamp, m.content]; }));
      if (signature === lastSignature) return;
      lastSignature = signature;
      var t = T();
      // Detach any "finalized" bubbles already in DOM (these own a bot message
      // by timestamp — we'll skip rendering that message and re-attach the bubble).
      var finalizedNodes = {};
      if (messagesEl) {
        messagesEl.querySelectorAll('[data-msg-ts]').forEach(function (el) {
          var ts = el.getAttribute('data-msg-ts');
          if (ts) {
            finalizedNodes[ts] = el;
            if (el.parentNode) el.parentNode.removeChild(el);
          }
        });
      }
      var latestIsAssistant = messages.length && messages[messages.length - 1].is_from_me;
      var lastTs = latestIsAssistant ? messages[messages.length - 1].timestamp : null;
      // If the latest assistant message just arrived and we have an active
      // streaming bubble, FINALIZE it (preserve content + steps) instead of
      // clearing — otherwise the thinking history is lost.
      if (latestIsAssistant && !finalizedNodes[lastTs] && streamingBubble) {
        // Replace the (possibly truncated) streaming preview with the full final content
        var finalContent = messages[messages.length - 1].content;
        var contentEl = streamingBubble.querySelector('.content');
        if (contentEl) contentEl.innerHTML = renderBody(finalContent);
        var bubbleEl = streamingBubble.querySelector('.bubble');
        if (bubbleEl && !bubbleEl.querySelector('.bubble-actions')) {
          var encoded = escAttr(encodeURIComponent(String(finalContent)));
          var footer = document.createElement('div');
          footer.className = 'bubble-actions';
          footer.innerHTML = '<button type="button" class="bubble-action-btn" data-copy="' + encoded + '">' +
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
            '<span class="bubble-action-label">' + esc(t.copy) + '</span>' +
          '</button>';
          bubbleEl.appendChild(footer);
        }
        finalizeStreamingBubble(lastTs);
        // Re-collect finalizedNodes since we just minted one
        if (messagesEl) {
          messagesEl.querySelectorAll('[data-msg-ts]').forEach(function (el) {
            var ts = el.getAttribute('data-msg-ts');
            if (ts && !finalizedNodes[ts]) {
              finalizedNodes[ts] = el;
              if (el.parentNode) el.parentNode.removeChild(el);
            }
          });
        }
        stopWorkStrip();
        streamingLocked = true;
      } else if (latestIsAssistant && !finalizedNodes[lastTs]) {
        // No streaming bubble (run ended without one) → just stop work-strip
        stopWorkStrip();
        streamingLocked = true;
      }
      // Preserve any *active* streaming bubble across the rebuild.
      // Keep it even when the latest message is from the assistant — the run
      // may still be in progress (multi-turn tool loop) and we don't want to
      // discard the bubble mid-conversation.
      var preservedStreamingBubble = (streamingBubble && streamingBubble.hasAttribute('data-streaming')) ? streamingBubble : null;
      if (preservedStreamingBubble && preservedStreamingBubble.parentNode) {
        preservedStreamingBubble.parentNode.removeChild(preservedStreamingBubble);
      }
      // Filter out messages whose timestamp is already owned by a finalized bubble.
      // Don't filter ALL messages out. If filtering would empty the chat,
      // skip the filter (prevents the screen from going blank when the only
      // bot message is owned by the finalized bubble while there are no other messages yet).
      var renderableMessages = messages.filter(function (m) { return !finalizedNodes[m.timestamp]; });
      var hasFinalized = Object.keys(finalizedNodes).length > 0;
      messages = renderableMessages;
      if (!messages.length && !hasFinalized) {
        messagesEl.innerHTML = '';
        showWelcomeIfEmpty();
        if (preservedStreamingBubble) messagesEl.appendChild(preservedStreamingBubble);
        return;
      }
      hideWelcome();
      messagesEl.innerHTML = '';   // clean slate; we'll append everything below
      messagesEl.insertAdjacentHTML('beforeend', messages.map(function (msg) {
        var kind = msg.is_from_me ? 'bot' : 'user';
        var name = msg.is_from_me ? assistantName : (msg.sender_name || t.userFallback);
        var role = msg.is_from_me ? t.roleAssistant : t.roleYou;
        var avatarChar = msg.is_from_me ? 'B' : ((name || 'U').charAt(0).toUpperCase());
        var encoded = escAttr(encodeURIComponent(String(msg.content)));
        var footerActions = msg.is_from_me
          ? '<div class="bubble-actions">' +
              '<button type="button" class="bubble-action-btn" data-copy="' + encoded + '">' +
                '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
                '<span class="bubble-action-label">' + esc(t.copy) + '</span>' +
              '</button>' +
              '<button type="button" class="bubble-action-btn" data-trace-jump="1">' +
                '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.527a3 3 0 0 1-.46 1.597L3.42 17.596A2 2 0 0 0 5.1 20.69h13.8a2 2 0 0 0 1.68-3.095l-4.12-6.47A3 3 0 0 1 16 9.527V2"/></svg>' +
                '<span class="bubble-action-label">' + esc(t.thoughtsDone) + '</span>' +
              '</button>' +
            '</div>'
          : '';
        return '<div class="bubble-row ' + kind + '" data-row-ts="' + escAttr(msg.timestamp) + '">' +
          '<div class="bubble-avatar" aria-hidden="true">' + esc(avatarChar) + '</div>' +
          '<article class="bubble ' + kind + '">' +
            '<div class="meta"><span class="badge">' + esc(role) + '</span>' +
              esc(name) + ' · ' + esc(msg.timestamp) +
            '</div>' +
            '<div class="content">' + renderBody(msg.content) + '</div>' +
            footerActions +
          '</article>' +
        '</div>';
      }).join(''));
      // Insert finalized bubbles in chronological order based on data-row-ts.
      Object.keys(finalizedNodes).sort().forEach(function (ts) {
        var node = finalizedNodes[ts];
        // Find the last child whose data-msg-ts (or the rendered message timestamp
        // we keep below in data-row-ts) is less than ts.
        var children = messagesEl.querySelectorAll('.bubble-row');
        var inserted = false;
        for (var i = 0; i < children.length; i++) {
          var childTs = children[i].getAttribute('data-row-ts') || '';
          if (childTs && childTs > ts) {
            messagesEl.insertBefore(node, children[i]);
            inserted = true;
            break;
          }
        }
        if (!inserted) messagesEl.appendChild(node);
      });
      if (preservedStreamingBubble) messagesEl.appendChild(preservedStreamingBubble);
      // Decorate every <pre> code block with a copy button
      messagesEl.querySelectorAll('.bubble .content').forEach(function (c) { enhanceCodeBlocks(c); });
      scrollChatToBottom();
    }

    function renderBody(text) {
      var upload = parseUploadMessage(text);
      if (upload) return renderUploadCard(upload);
      var html = markdownToSafeHtml(String(text));
      var files = extractFileLinks(text).concat(extractWorkspaceFileLinks(text));
      // dedupe
      var seen = {};
      var dedup = files.filter(function (p) { if (seen[p]) return false; seen[p] = true; return true; });
      return html + renderFileActions(dedup);
    }

    /* Detect /workspace/group/... paths the agent creates and map them to
       the backend's chat-scoped file route: /files/chat/<chatJid>/<rel> */
    function extractWorkspaceFileLinks(text) {
      var out = [];
      var seen = {};
      var re = /\/workspace\/group\/([\w./%-]+)/g;
      var m;
      var jidEnc = encodeURIComponent(chatJid);
      while ((m = re.exec(String(text))) !== null) {
        var rel = m[1];
        var webPath = '/files/chat/' + jidEnc + '/' + rel;
        if (!seen[webPath]) { seen[webPath] = true; out.push(webPath); }
      }
      return out;
    }

    /* Add a copy button + language pill on every code block after render. */
    function enhanceCodeBlocks(rootEl) {
      if (!rootEl) return;
      var pres = rootEl.querySelectorAll('pre');
      pres.forEach(function (pre) {
        if (pre.dataset.enhanced === '1') return;
        pre.dataset.enhanced = '1';
        var wrap = document.createElement('div');
        wrap.className = 'codeblock';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'codeblock-copy';
        btn.textContent = T().copy || 'Copy';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var raw = pre.innerText || pre.textContent || '';
          navigator.clipboard.writeText(raw).then(function () {
            btn.textContent = T().copied || 'Copied';
            setTimeout(function () { btn.textContent = T().copy || 'Copy'; }, 1200);
          }).catch(function () {
            btn.textContent = T().copyFail || 'Failed';
            setTimeout(function () { btn.textContent = T().copy || 'Copy'; }, 1200);
          });
        });
        wrap.appendChild(btn);
      });
    }

    function parseUploadMessage(text) {
      var lines = String(text).split('\n');
      var fileLine = lines.find(function (line) { return line.startsWith('Uploaded file: '); });
      var workspaceLine = lines.find(function (line) { return line.startsWith('Workspace path: '); });
      var previewLine = lines.find(function (line) { return line.startsWith('Preview URL: '); });
      if (!fileLine || !workspaceLine || !previewLine) return null;
      return {
        filename: fileLine.slice('Uploaded file: '.length),
        workspacePath: workspaceLine.slice('Workspace path: '.length),
        previewUrl: previewLine.slice('Preview URL: '.length),
      };
    }

    function renderUploadCard(file) {
      var t = T();
      var escapedName = esc(file.filename);
      var escapedPath = esc(file.workspacePath);
      var escapedPreview = esc(file.previewUrl);
      var isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.filename);
      var preview = isImage ? '<img class="preview" src="' + escapedPreview + '" alt="' + escapedName + '">' : '';
      return '<section class="file-card"><div class="file-title">' + esc(t.uploadedPrefix) + escapedName + '</div><div class="file-path">' + escapedPath + '</div>' + preview +
        '<div class="file-actions"><a class="file-button" href="' + escapedPreview + '" target="_blank" rel="noreferrer">' + esc(t.openFile) + '</a>' +
        '<a class="file-button" href="' + escapedPreview + '" download>' + esc(t.download) + '</a></div></section>';
    }

    async function refreshMessages() {
      try {
        var res = await fetch('/api/messages?scope=chat&chatJid=' + encodeURIComponent(chatJid));
        if (!res.ok) return;
        var data = await res.json();
        render(data.messages || []);
      } catch (e) {}
    }

    if (messagesEl) {
      messagesEl.addEventListener('click', async function (event) {
        var traceJumpBtn = event.target && event.target.closest
          ? event.target.closest('[data-trace-jump]')
          : null;
        if (traceJumpBtn) {
          event.preventDefault();
          // Find the bubble's timestamp so we can scroll to the matching run
          var ownerRow = traceJumpBtn.closest('.bubble-row');
          var rowTs = ownerRow ? ownerRow.getAttribute('data-row-ts') : '';
          openTracePanel();
          // After trace renders, jump to the matching task card
          setTimeout(function () { scrollTraceToRun(rowTs); }, 200);
          return;
        }
        var btn = event.target && event.target.closest
          ? event.target.closest('.copy-btn, .bubble-action-btn[data-copy]')
          : null;
        if (!btn) return;
        event.preventDefault();
        var payload = btn.getAttribute('data-copy') || '';
        var raw = '';
        try { raw = decodeURIComponent(payload); } catch (e) { raw = payload; }
        var t = T();
        var labelEl = btn.querySelector('.bubble-action-label') || btn;
        var orig = labelEl.textContent;
        try {
          await navigator.clipboard.writeText(raw);
          labelEl.textContent = t.copied;
          setTimeout(function () { labelEl.textContent = orig || t.copy; }, 1200);
        } catch (e2) {
          labelEl.textContent = t.copyFail;
          setTimeout(function () { labelEl.textContent = orig || t.copy; }, 1200);
        }
      });
    }

    function startPolling() {
      if (pollTimer) return;
      setChatConn('poll');
      pollTimer = setInterval(refreshMessages, 2000);
    }
    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function connectChatSse() {
      try {
        chatEs = new EventSource('/api/events?chatJid=' + encodeURIComponent(chatJid));
        chatEs.onopen = function () { setChatConn('sse'); stopPolling(); };
        chatEs.onmessage = function () { refreshMessages(); };
        chatEs.onerror = function () {
          if (chatEs) { chatEs.close(); chatEs = null; }
          setChatConn('poll');
          startPolling();
        };
      } catch (e) { startPolling(); }
    }

    if (threadListEl) {
      threadListEl.addEventListener('click', async function (event) {
        var actionButton = event.target && event.target.closest ? event.target.closest('[data-thread-action]') : null;
        if (actionButton) {
          event.preventDefault();
          event.stopPropagation();
          var action = actionButton.getAttribute('data-thread-action');
          var actionChatJid = actionButton.getAttribute('data-chat-jid');
          if (!action || !actionChatJid) return;
          if (action === 'rename') {
            await renameThread(actionChatJid);
          } else if (action === 'archive') {
            await archiveThread(actionChatJid);
          }
          return;
        }
        var button = event.target && event.target.closest ? event.target.closest('.thread-item') : null;
        if (!button) return;
        var nextChatJid = button.getAttribute('data-chat-jid');
        if (nextChatJid) await setActiveThread(nextChatJid);
      });
      threadListEl.addEventListener('keydown', async function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        var item = event.target && event.target.closest ? event.target.closest('.thread-item') : null;
        if (!item) return;
        event.preventDefault();
        var nextChatJid = item.getAttribute('data-chat-jid');
        if (nextChatJid) await setActiveThread(nextChatJid);
      });
    }

    if (newThreadBtn) {
      newThreadBtn.addEventListener('click', async function () {
        // No prompt — just create an empty chat. Title auto-fills from first message.
        newThreadBtn.disabled = true;
        try {
          var res = await fetch('/api/threads', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify({ title: '' }),
          });
          if (!res.ok) throw new Error('THREAD_CREATE_FAIL');
          var data = await res.json();
          await refreshThreads();
          if (data.thread && data.thread.chatJid) {
            await setActiveThread(data.thread.chatJid);
          }
        } catch (e) {
          setStatus(T().threadCreateFail);
        } finally {
          newThreadBtn.disabled = false;
        }
      });
    }

    if (manageRefreshBtn) {
      manageRefreshBtn.addEventListener('click', function () {
        refreshManagementPanels();
      });
    }

    if (manageCommandBtn) {
      manageCommandBtn.addEventListener('click', function () {
        runManageCommand((manageCommandInput && manageCommandInput.value || '').trim());
      });
    }

    if (manageCommandInput) {
      manageCommandInput.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        runManageCommand(manageCommandInput.value.trim());
      });
    }

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileNameEl.textContent = file ? file.name : T().noFile;
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });

    async function autoTitleIfNeeded(promptText) {
      try {
        var current = threads.find(function (t) { return t.chatJid === chatJid; });
        if (!current) return;
        var existing = (current.title || '').trim();
        // Only auto-title if the thread has no real title yet
        if (existing && existing !== T().threadUntitled && existing !== '新对话' && existing !== 'New chat' && existing !== 'New thread') return;
        var clean = String(promptText).replace(/\s+/g, ' ').trim();
        if (!clean) return;
        var nextTitle = clean.length > 24 ? clean.slice(0, 24) + '…' : clean;
        await fetch('/api/threads/' + encodeURIComponent(chatJid), {
          method: 'PATCH',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify({ title: nextTitle }),
        });
        await refreshThreads();
      } catch (e) {}
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var text = input.value.trim();
      var file = fileInput.files && fileInput.files[0];
      if (!text && !file) return;
      streamingLocked = false;   // new run starting — allow streaming bubble again
      sendBtn.disabled = true;
      var promptForTitle = text;
      try {
        if (file) {
          setStatus(T().uploading);
          var upRes = await fetch('/api/upload?chatJid=' + encodeURIComponent(chatJid), {
            method: 'POST',
            headers: { 'x-file-name': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' },
            body: file,
          });
          if (!upRes.ok) throw new Error('UPLOAD_FAIL');
          fileInput.value = '';
          fileNameEl.textContent = T().noFile;
        }
        if (text) {
          var res2 = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatJid: chatJid, text: text }),
          });
          if (!res2.ok) throw new Error('SEND_FAIL');
          input.value = '';
        }
        setStatus('');
        await refreshMessages();
        if (promptForTitle) autoTitleIfNeeded(promptForTitle);
      } catch (e) {
        var msg = e && e.message;
        if (msg === 'UPLOAD_FAIL') setStatus(T().uploadFail);
        else if (msg === 'SEND_FAIL') setStatus(T().sendFail);
        else setStatus(String(msg || ''));
      } finally {
        sendBtn.disabled = false;
      }
    });

    function setStatus(text) { statusEl.textContent = text || ''; }

    async function createFreshThread() {
      try {
        var res = await fetch('/api/threads', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify({ title: '' }),
        });
        if (!res.ok) return null;
        var data = await res.json();
        return data && data.thread && data.thread.chatJid ? data.thread.chatJid : null;
      } catch (e) { return null; }
    }

    function isThreadEmpty(jid) {
      var t = threads.find(function (x) { return x.chatJid === jid; });
      // Empty thread = lastActivity hasn't moved past addedAt (no real messages yet)
      return t && t.lastActivity === t.addedAt;
    }

    (async function initThreadsAndChat() {
      try {
        await refreshThreads();
        // Pick chatJid in this order:
        //  1. An existing "empty" thread (created but never used) — reuse it
        //  2. Otherwise create a fresh empty one (non-blocking: if it fails, fall back)
        //  3. Fall back to whatever thread we already have
        //  4. Final fallback: the default local-web JID (backend always honors it)
        var picked = null;
        try {
          var emptyThread = threads.find(function (x) { return isThreadEmpty(x.chatJid); });
          if (emptyThread) picked = emptyThread.chatJid;
        } catch (_) {}
        if (!picked) {
          try {
            var newJid = await createFreshThread();
            if (newJid) {
              picked = newJid;
              await refreshThreads();
            }
          } catch (_) {}
        }
        if (!picked && threads.length > 0) picked = threads[0].chatJid;
        if (!picked) picked = chatJid;   // whatever the server told us via /api/config
        chatJid = picked;
        if (jidEl) jidEl.textContent = chatJid;
        try { localStorage.setItem(THREAD_KEY, chatJid); } catch (_) {}
      } catch (e) {
        console.warn('[bioclaw] thread init failed', e);
      }
      // Render UI regardless of what happened above — never leave the screen blank.
      renderThreads();
      refreshMessages();
      refreshManagementPanels();
      connectChatSse();
      ensureTraceSseAlways();
    })();
})();
