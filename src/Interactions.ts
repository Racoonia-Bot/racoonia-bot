import { Ping } from "./commands/Ping";
import { Donate } from "./commands/Donate";
import { Feedback } from "./commands/Feedback";
import { Command, Component } from "./InteractionEssentials";
import { Changelog } from "./commands/Changelog";
import { ChangelogList } from "./components/ChangelogList";

export const Commands: Command[] = [
    Feedback,
    Donate,
    Ping,
    Changelog,
];

export const Components: Component<any>[] = [
    ChangelogList,
];
