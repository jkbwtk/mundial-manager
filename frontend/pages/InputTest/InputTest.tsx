import { createSignal } from 'solid-js';
import { Input } from '#components/Input';
import { Divider, Widget } from '#components/Widget';
import style from './InputTest.module.scss';

export const InputTest: Component = () => {
  const [textValue, setTextValue] = createSignal('Hello World');
  const [emailValue, setEmailValue] = createSignal('user@example.com');
  const [passwordValue, setPasswordValue] = createSignal('secret123');
  const [numberValue, setNumberValue] = createSignal('42');
  const [searchValue, setSearchValue] = createSignal('search term');
  const [dateValue, setDateValue] = createSignal('2025-09-25');
  const [rangeValue, setRangeValue] = createSignal('75');

  return (
    <Widget topLeftLabels="Input Component Test" class={style.outerContainer}>
      <div class={style.container}>
        <br />
        Input:{' '}
        <Input
          value={textValue()}
          onInput={(e) => setTextValue(e.currentTarget.value)}
          placeholder="Enter text..."
        />
        <Divider />
        Secondary input:{' '}
        <Input
          value={searchValue()}
          onInput={(e) => setSearchValue(e.currentTarget.value)}
          placeholder="Search..."
          type="search"
        />
        <Divider />
        Danger input:{' '}
        <Input
          value={passwordValue()}
          onInput={(e) => setPasswordValue(e.currentTarget.value)}
          placeholder="Password..."
          type="password"
        />
        <Divider />
        Disabled input:{' '}
        <Input value="Cannot edit this" disabled placeholder="Disabled..." />
        <Divider />
        Number input:{' '}
        <Input
          type="number"
          value={numberValue()}
          onInput={(e) => setNumberValue(e.currentTarget.value)}
          placeholder="0"
          min="0"
          max="999"
        />{' '}
        Email input:{' '}
        <Input
          type="email"
          value={emailValue()}
          onInput={(e) => setEmailValue(e.currentTarget.value)}
          placeholder="user@example.com"
        />{' '}
        Date input:{' '}
        <Input
          type="date"
          value={dateValue()}
          onInput={(e) => setDateValue(e.currentTarget.value)}
        />
        <Divider />
        Range input:{' '}
        <Input
          type="range"
          value={rangeValue()}
          onInput={(e) => setRangeValue(e.currentTarget.value)}
          min="0"
          max="100"
        />{' '}
        Value: {rangeValue()}
        <Divider />
        Full width input:{' '}
        <Input placeholder="This spans the full width of the container..." />
        <Divider />
        File input: <Input type="file" accept=".txt,.json,.csv" />
      </div>
    </Widget>
  );
};

export default InputTest;
