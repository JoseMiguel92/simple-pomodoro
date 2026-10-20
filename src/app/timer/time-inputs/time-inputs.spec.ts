import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeInputs } from './time-inputs';

describe('TimeInputs', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimeInputs] }).compileComponents();
  });

  const createFixture = async (
    focusMinutes = 25,
    breakMinutes = 5,
    disabled = false,
  ): Promise<ComponentFixture<TimeInputs>> => {
    const fixture = TestBed.createComponent(TimeInputs);
    fixture.componentRef.setInput('focusMinutes', focusMinutes);
    fixture.componentRef.setInput('breakMinutes', breakMinutes);
    fixture.componentRef.setInput('disabled', disabled);
    await fixture.whenStable();
    return fixture;
  };

  const field = (fixture: ComponentFixture<TimeInputs>, id: string): HTMLInputElement => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`No field found for id "${id}"`);
    }
    return input;
  };

  it('should create', async () => {
    const fixture = await createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the received minutes in both fields', async () => {
    const fixture = await createFixture(40, 10);

    expect(field(fixture, 'focus-minutes').value).toBe('40');
    expect(field(fixture, 'break-minutes').value).toBe('10');
  });

  it('should be a number field limited to 1..60', async () => {
    const fixture = await createFixture();
    const focus = field(fixture, 'focus-minutes');
    const rest = field(fixture, 'break-minutes');

    for (const input of [focus, rest]) {
      expect(input.type).toBe('number');
      expect(input.min).toBe('1');
      expect(input.max).toBe('60');
    }
  });

  it('should label each field with a writable Spanish name (RNF-4)', async () => {
    const fixture = await createFixture();
    const labels = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLLabelElement>(
      'label',
    );

    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toContain('Concentración (min)');
    expect(labels[1].textContent).toContain('Descanso (min)');
    // Each label points to an existing field: `for`/`id` are wired up.
    for (const label of Array.from(labels)) {
      const target = label.ownerDocument.getElementById(label.htmlFor);
      expect(target).toBe(label.control);
    }
  });

  it('should keep both fields editable while not disabled', async () => {
    const fixture = await createFixture();

    expect(field(fixture, 'focus-minutes').disabled).toBe(false);
    expect(field(fixture, 'break-minutes').disabled).toBe(false);
  });

  it('should disable both fields while the timer is running (CA-7.3)', async () => {
    const fixture = await createFixture(25, 5, true);

    expect(field(fixture, 'focus-minutes').disabled).toBe(true);
    expect(field(fixture, 'break-minutes').disabled).toBe(true);
  });

  it('should emit the focus value exactly as typed, without validating it', async () => {
    const fixture = await createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.focusChange.subscribe((value) => emitted.push(value));
    const focus = field(fixture, 'focus-minutes');

    focus.value = '42';
    focus.dispatchEvent(new Event('input'));
    focus.value = '0';
    focus.dispatchEvent(new Event('input'));
    focus.value = '';
    focus.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['42', '0', '']);
  });

  it('should emit the break value exactly as typed, without validating it', async () => {
    const fixture = await createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.breakChange.subscribe((value) => emitted.push(value));
    const rest = field(fixture, 'break-minutes');

    rest.value = '60';
    rest.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['60']);
  });
});
