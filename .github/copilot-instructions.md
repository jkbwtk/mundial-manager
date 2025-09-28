## General Guidelines

- Don't waste tokens on describing the task and actions you are performing, keep it concise
- Use available context to understand the task
- If you don't have enough context, ask for more information
- Available scripts are defined in package.json
- The development server is always running so don't suggest starting it
- Pages are pregenerated so keep SSR compatibility in mind
- Test pages are used to test components in isolation (consult ButtonTest, SheetsTest and other \*Test pages to get general idea)

## Coding standards

- Avoid using emojis
- Consult solidjs documentation
- Don't use comments in the code
- Don't create documentation
- Use programming patterns and best practices
- Write clean and maintainable code
- Don't crease summary files for any tasks
- Index files and scss module type declarations are generated automatically
- Use best practices for solidjs
- Component and ParentComponent types are defined globally
- Minimize the use of side effects
- Use only scss modules for styling.
- Use onDestroy lifecycle method to clean up event listeners and other stuff that should be properly disposed of
- Keep in mind that everything should be SSR compatible
- Use solid-primitives where appropriate
- If a page requires additional files like scss module it should be located in a dedicated folder with the same name as the page
- When adding new pages update the routes.tsx file
- Don't try to edit index.ts files, they are generated automatically
- Don't provide edit summaries
- Ignore typescript type errors regarding missing class names in scss modules, ask for typescript server restart if you want to make sure the types are defined correctly

## UI Guidelines

- Entire gui is stylized to look like a terminal
- Fonts and colors are defined in \_app.css
- Every text has the same size
- Everything should be aligned to the global grid
- Use only the colors defined in \_app.css
- Component sizes are defined in line heights and character widths
- ch and cw functions are used to define sizes
- Keep the design minimalistic and clean
- Keep mobile responsiveness in mind
- Widget component is used as generic container
- Consult existing components for design patterns
- Base component and page designs on terminal applications like btop, neofetch, nmtui
- All containers should have transparent background so the acrylic effect is visible through them (unless they are supposed to be displayed on top of other containers)
- Use css effects like blur where appropriate
- Text that is supposed to update can be animated with AnimatedText component
- Text that can overflow can be wrapped in TextMarquee component
- MaterialSymbol component is used for icons, it uses Googles Material Symbols, supported symbols are defined in supportedMaterialSymbols.ts file, new symbols can be added there
- Don't declare components as functions, use const with type Component or ParentComponent
- Use transitions and animations especially for changing colors
- Don't use elements like headers and paragraphs that impact page layout and font sizes
- Font sizes should not be changed either explicitly or by default styles of html elements
- Test pages should fill the entire screen
- Make use of round function in css to make sure component widths and heights are always floored to character widths and line heights
- Use ButtonTest page as an example of how to create test pages
- Avoid using margins and paddings
- Stick to the global grid for positioning and spacing of elements
- Stick to the global grid when using borders
- Don't use React patterns like condition && <Component /> for conditional rendering use <Show> component instead, same goes for lists use <For> component instead of map function and <Switch> component for multiple conditions instead of chained if else statements
- Use classList instead of joining classes manually
- Allow passing class to components and merging it with component's own classes using classList (check Button component for example on how to merge classes and other properties correctly)
- Don't use camelCase in scss modules
- Class names in scss modules are converted to camelCase so use camelCase when referencing them in typescript files

## Libraries and Frameworks

- Use SolidJS for building user interfaces
- Use TypeScript for type safety and better developer experience
- Use SCSS modules for styling components
- Use Zod validator v4 (consult zod documentation for changes in this version compared to v3)
- Use Chart.js for charts
