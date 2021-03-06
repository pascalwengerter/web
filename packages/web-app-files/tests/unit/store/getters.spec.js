import getters from '@files/src/store/getters'
import FixtureFiles from '@/__fixtures__/files'

let state

describe('Getters', () => {
  beforeEach(() => {
    state = {
      files: FixtureFiles['/'],
      fileSortField: 'name',
      searchTermGlobal: '',
      filesPageLimit: 10,
      fileSortDirectionDesc: 'desc'
    }
  })

  describe('activeFiles', () => {
    const cases = [
      ['contains', true],
      ['hides', false]
    ]

    it.each(cases)('%s hidden files if areHiddenFilesShown is set to %s', value => {
      state.areHiddenFilesShown = value

      const { activeFiles, filesAll } = getters
      const result = activeFiles(state, { filesAll: filesAll(state) })

      expect(result.length).toEqual(5)
    })
  })
})
