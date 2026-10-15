
# FocusBoard

一个人用的本地任务看板。数据只放在这台浏览器的 `localStorage` 里，没有账号，也不访问外部接口。

## 启动

安装 Node.js 24，并确认 `node` 和 `npm` 已在 `PATH` 中。仓库已包含锁文件，首次安装使用 `npm ci`：

```bash
npm ci
npm run dev
```

开发服务默认是 `http://127.0.0.1:5173`。

## 测试、类型检查和构建

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` 用 Vitest 覆盖任务校验、组合筛选、截止日期排序、逾期规则、导入导出、损坏存档，以及创建、删除确认、焦点和持久化。`npm run build` 生成 `dist/`。

## 功能

- 创建、编辑、删除任务。标题必填，保存时去掉首尾空白。还可以写描述、状态（待办 / 进行中 / 完成）、优先级（低 / 中 / 高）、可选截止日期和逗号分隔的标签。
- 看板和列表两种视图。可以搜索标题和描述，并按状态、优先级、标签组合筛选。截止日期可从早到晚或从晚到早排序，没有日期的任务排在最后。筛选可以一键清除。
- 概览显示任务总数、完成率和逾期数。已完成的任务不算逾期，截止日当天也不算逾期。没有任务时完成率是 0%。
- 首次打开会写入少量演示数据。清空后保存空列表，刷新不会再灌回演示数据。
- 导出 JSON，再导入会保留每条任务的全部字段。导入先校验；文件损坏、字段缺失、枚举错误或 id 重复时会提示原因，并保留当前任务。文件里只要有一条不合法，包括只有第二条不合法，就整批拒绝，已有任务和字段都不会改变。
- 新建、编辑、删除确认和清空确认都把键盘焦点留在弹窗里。Esc、取消、保存或确认关闭后，焦点回到打开弹窗的按钮。

## 已知限制

- 只支持当前浏览器的本地存储，没有多设备同步。
- 已保存的内容如果损坏，页面会显示空白看板并提示，且不会立刻覆盖原来的存档；下一次成功保存才会写入新内容。
- 导入会替换全部任务，不会和现有任务合并。
- 截止日期按本地日历日 `YYYY-MM-DD` 比较，不按时区把日期折到前一天。
- 不支持拖拽排序，也不加载远程字体或图片。

## 持续集成

`.github/workflows/ci.yml` 会在推送到 `main` 或 `codex/focusboard`，以及面向 `main` 的 pull request 上执行当前已有的检查：`npm ci`、`npm test`、`npm run typecheck`、`npm run lint` 和 `npm run build`。工作流写明了这些命令，并不表示远端 CI 已经运行成功。

## Developer collaboration note
Keep JSON exports safe. This demo stores tasks only in the current browser.

Git workflow probe: baseline.
