import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';
import type { Store } from 'solid-js/store';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Widget } from '#components/Widget';
import { mapExtensionToSymbol } from '#flib/extensionSymbols';
import style from './FileTree.module.scss';

export interface TreeNode {
  name: string;
  children: TreeNode[] | null;
}

export interface FileTreeProps {
  fileTree: Store<TreeNode>;
}

interface DirectoryProps {
  node: TreeNode;
  levels: boolean[];
  parentNames: string[];
  last: boolean;
}

interface LevelsProps {
  levels: boolean[];
  last: boolean;
}

const Levels: Component<LevelsProps> = (props) => {
  return (
    <For each={props.levels}>
      {(level, index) => {
        return (
          <Switch fallback={' '}>
            <Match
              when={level && index() === props.levels.length - 1 && props.last}
            >
              └
            </Match>

            <Match when={level && index() === props.levels.length - 1}>├</Match>

            <Match when={level}>│</Match>
          </Switch>
        );
      }}
    </For>
  );
};

export const Directory: Component<DirectoryProps> = (props) => {
  const [open, setOpen] = createSignal(true);

  const levels = createMemo(() => {
    const copy = props.levels.slice();

    props.last && copy.pop() !== undefined && copy.push(false);
    copy.push(true);

    return copy;
  });

  return (
    <>
      <div class={style.entry} onMouseUp={() => setOpen((o) => !o)}>
        <Levels levels={props.levels} last={props.last} />

        <MaterialSymbol symbol={open() ? 'folder_open' : 'folder'} />

        {props.node.name}
        {!props.node.name.endsWith('/') && '/'}
      </div>
      <Show when={open()}>
        <For each={props.node.children}>
          {(node, index) => (
            <Show
              when={node.children === null}
              fallback={
                <Directory
                  node={node}
                  levels={levels()}
                  parentNames={[...props.parentNames, props.node.name]}
                  last={index() === props.node.children!.length - 1}
                />
              }
            >
              <div class={style.entry}>
                <Levels
                  levels={levels()}
                  last={index() === props.node.children!.length - 1}
                />
                <MaterialSymbol symbol={mapExtensionToSymbol(node.name)} />
                {node.name}
              </div>
            </Show>
          )}
        </For>
      </Show>
    </>
  );
};

export const FileTree: Component<FileTreeProps> = (props) => {
  return (
    <Widget title="File Tree" class={style.container}>
      <Directory
        node={props.fileTree}
        levels={[]}
        parentNames={[]}
        last={true}
      />
    </Widget>
  );
};
