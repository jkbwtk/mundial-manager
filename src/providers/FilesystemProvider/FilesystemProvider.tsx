import { createContext, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface FilesystemContextState {
  ready: boolean;
  totalSpace: number;
  usedSpace: number;
}

export interface FilesystemContextActions {
  listFiles: () => Promise<Map<string, FileSystemHandle>>;
  createFile: (name: string, data: FileSystemWriteChunkType) => Promise<void>;
  readFile: (name: string) => Promise<File>;
  updateFile: (name: string, data: FileSystemWriteChunkType) => Promise<void>;
  deleteFile: (name: string) => Promise<void>;

  getFileHandle: (name: string) => Promise<FileSystemFileHandle>;
}

export type FilesystemContextValue = [
  state: FilesystemContextState,
  actions: FilesystemContextActions,
];

const defaultState: FilesystemContextState = {
  get ready(): boolean {
    return this.totalSpace > 0;
  },

  totalSpace: 0,
  usedSpace: 0,
};

const FilesystemContext = createContext<FilesystemContextValue>([
  structuredClone(defaultState),
  {
    listFiles: () => {
      throw new Error('FilesystemContext: listFiles() called before provider');
    },
    createFile: () => {
      throw new Error('FilesystemContext: addFile() called before provider');
    },
    readFile: () => {
      throw new Error('FilesystemContext: readFile() called before provider');
    },
    updateFile: () => {
      throw new Error('FilesystemContext: updateFile() called before provider');
    },
    deleteFile: () => {
      throw new Error('FilesystemContext: removeFile() called before provider');
    },

    getFileHandle: () => {
      throw new Error(
        'FilesystemContext: getFileHandle() called before provider',
      );
    },
  },
]);

export const FilesystemProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<FilesystemContextState>(
    structuredClone(FilesystemContext.defaultValue[0]),
  );

  const updateSpace = async () => {
    const { quota, usage } = await navigator.storage.estimate();

    setState({
      totalSpace: quota,
      usedSpace: usage,
    });
  };

  const getRootHandle = (): Promise<FileSystemDirectoryHandle> => {
    return navigator.storage.getDirectory();
  };

  const listFiles = async (): Promise<Map<string, FileSystemHandle>> => {
    const files = new Map<string, FileSystemHandle>();

    const directoryHandle = await getRootHandle();

    for await (const [name, test] of directoryHandle) {
      files.set(name, test);
    }

    return files;
  };

  const createFile = async (
    name: string,
    data: FileSystemWriteChunkType,
  ): Promise<void> => {
    const rootHandle = await getRootHandle();
    const fileHandle = await rootHandle.getFileHandle(name, {
      create: true,
    });

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    await updateSpace();
  };

  const readFile = async (name: string): Promise<File> => {
    const rootHandle = await getRootHandle();
    const fileHandle = await rootHandle.getFileHandle(name);

    return await fileHandle.getFile();
  };

  const updateFile = async (
    name: string,
    data: FileSystemWriteChunkType,
  ): Promise<void> => {
    const rootHandle = await getRootHandle();
    const fileHandle = await rootHandle.getFileHandle(name, {
      create: false,
    });

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    await updateSpace();
  };

  const deleteFile = async (name: string): Promise<void> => {
    const rootHandle = await getRootHandle();
    await rootHandle.removeEntry(name);

    await updateSpace();
  };

  const getFileHandle = async (name: string): Promise<FileSystemFileHandle> => {
    const rootHandle = await getRootHandle();
    return await rootHandle.getFileHandle(name);
  };

  onMount(async () => {
    const { quota, usage } = await navigator.storage.estimate();

    setState({
      ready: true,
      totalSpace: quota,
      usedSpace: usage,
    });
  });

  return (
    <FilesystemContext.Provider
      value={[
        state,
        {
          listFiles,
          createFile,
          readFile,
          updateFile,
          deleteFile,
          getFileHandle,
        },
      ]}
    >
      {props.children}
    </FilesystemContext.Provider>
  );
};

export const useFilesystem = () => useContext(FilesystemContext);
