import { createSignal } from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { DateInput } from '#components/DateInput';
import { Input } from '#components/Input';
import { Divider } from '#components/Widget';
import style from './InputTest.module.scss';

export const InputTest: Component = () => {
  const [textValue, setTextValue] = createSignal('Hello World');
  const [emailValue, setEmailValue] = createSignal('user@example.com');
  const [passwordValue, setPasswordValue] = createSignal('secret123');
  const [numberValue, setNumberValue] = createSignal('42');
  const [invalidValue, setInvalidValue] = createSignal('test');
  const [dateValue, setDateValue] = createSignal<Date | null>(null);
  const [rangeValue, setRangeValue] = createSignal('75');
  const [checkboxValue, setCheckboxValue] = createSignal(false);
  const [invalidCheckboxValue, setInvalidCheckboxValue] = createSignal(true);
  const [colorValue, setColorValue] = createSignal('#dcb543');
  const [invalidColorValue, setInvalidColorValue] = createSignal('#70dad4');

  return (
    <div class={style.container}>
      Input:{' '}
      <Input
        value={textValue()}
        onInput={(e) => setTextValue(e.currentTarget.value)}
        placeholder="Enter text..."
      />
      <Divider />
      Invalid input:{' '}
      <Input
        value={invalidValue()}
        onInput={(e) => setInvalidValue(e.currentTarget.value)}
        placeholder="Invalid..."
        type="text"
        invalid
      />
      <Divider />
      Password input:{' '}
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
      <Divider />
      Date input:{' '}
      <DateInput value={dateValue()} onInput={(v) => setDateValue(v)} />
      <Button severity="secondary" onClick={() => setDateValue(null)}>
        Clear
      </Button>{' '}
      Date value: {dateValue()?.toISOString() ?? 'None'}
      <Break />
      Disabled date input:{' '}
      <DateInput
        value={dateValue()}
        onInput={(v) => setDateValue(v)}
        disabled
      />
      <Break />
      Invalid date input:{' '}
      <DateInput value={dateValue()} onInput={(v) => setDateValue(v)} invalid />
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
      Checkbox input:{' '}
      <Input
        type="checkbox"
        checked={checkboxValue()}
        onInput={(e) => setCheckboxValue(e.currentTarget.checked)}
      />{' '}
      Value: {checkboxValue() ? 'On' : 'Off'}
      <Divider />
      Invalid checkbox:{' '}
      <Input
        type="checkbox"
        checked={invalidCheckboxValue()}
        onInput={(e) => setInvalidCheckboxValue(e.currentTarget.checked)}
        invalid
      />{' '}
      Value: {invalidCheckboxValue() ? 'On' : 'Off'}
      <Divider />
      Disabled checkbox: <Input type="checkbox" checked disabled />
      <Divider />
      Full width input:{' '}
      <Input placeholder="This spans the full width of the container..." />
      <Divider />
      File input: <Input type="file" accept=".txt,.json,.csv" />
      <Divider />
      Color input:{' '}
      <Input
        type="color"
        value={colorValue()}
        onInput={(e) => setColorValue(e.currentTarget.value)}
      />{' '}
      Value: {colorValue()}
      <Divider />
      Invalid color input:{' '}
      <Input
        type="color"
        value={invalidColorValue()}
        onInput={(e) => setInvalidColorValue(e.currentTarget.value)}
        invalid
      />{' '}
      Value: {invalidColorValue()}
      <Divider />
      Disabled color input: <Input type="color" value="#136fac" disabled />
      <Divider />
      Radio input:{' '}
      <div>
        <Input type="radio" name="exampleRadio" value="option1">
          Option 1
        </Input>
      </div>
      <div>
        <Input type="radio" name="exampleRadio" value="option2">
          Option 2
        </Input>
      </div>
      <div>
        <Input type="radio" name="exampleRadio" value="option3" disabled>
          Option 3 (Disabled)
        </Input>
      </div>
      <div>
        <Input type="radio" name="exampleRadio" value="option3" checked>
          Option 4
        </Input>
      </div>
    </div>
  );
};

export default InputTest;
